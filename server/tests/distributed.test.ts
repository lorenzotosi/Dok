import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { io as clientIo } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import * as Y from 'yjs';
import { RedisMemoryServer } from 'redis-memory-server';
import { TiptapTransformer } from '@hocuspocus/transformer';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from './setup.js';

let redisServer: RedisMemoryServer;

// Variabili per i moduli caricati dinamicamente
let setupSockets: any;
let app: any;
let redisClient: any;
let connectRedis: any;
let PresenceManager: any;
let DocumentModel: any;
let UserModel: any;

// Server HTTP e Socket.io
let httpServer1: any;
let httpServer2: any;
let io1: SocketServer;
let io2: SocketServer;

const JWT_SECRET = 'test-secret';

beforeAll(async () => {
    // 1. Avvio di Redis in-memory
    redisServer = new RedisMemoryServer();
    await redisServer.start();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    const redisUrl = `redis://${host}:${port}`;
    process.env.REDIS_URL = redisUrl;
    process.env.JWT_SECRET = JWT_SECRET;

    // 2. Connessione a MongoDB in-memory
    await connectDBForTesting();

    // 3. Caricamento dinamico dei moduli per assicurare l'uso delle env corrette
    const redisModule = await import('../src/config/redis.js');
    redisClient = redisModule.redisClient;
    connectRedis = redisModule.connectRedis;
    await connectRedis();

    const socketsModule = await import('../src/sockets/index.js');
    setupSockets = socketsModule.setupSockets;

    const appModule = await import('../src/app.js');
    app = appModule.app;

    const presenceModule = await import('../src/sockets/presenceManager.js');
    PresenceManager = presenceModule.PresenceManager;

    const documentModelModule = await import('../src/models/Document.js');
    DocumentModel = documentModelModule.default;

    const userModelModule = await import('../src/models/User.js');
    UserModel = userModelModule.UserModel;

    // 4. Inizializzazione Server 1 su porta 3001
    httpServer1 = createServer(app);
    io1 = new SocketServer(httpServer1, {
        cors: { origin: '*' }
    });
    await setupSockets(io1);
    await new Promise<void>((resolve) => httpServer1.listen(3001, () => resolve()));

    // 5. Inizializzazione Server 2 su porta 3002
    httpServer2 = createServer(app);
    io2 = new SocketServer(httpServer2, {
        cors: { origin: '*' }
    });
    await setupSockets(io2);
    await new Promise<void>((resolve) => httpServer2.listen(3002, () => resolve()));
});

afterAll(async () => {
    // Disconnetti i client Redis interni degli adapter Socket.io prima di stoppare il server Redis
    const adapter1 = io1?.of('/').adapter as any;
    const adapter2 = io2?.of('/').adapter as any;

    if (adapter1 && adapter1.pubClient) {
        await Promise.all([
            adapter1.pubClient.disconnect(),
            adapter1.subClient.disconnect()
        ]).catch(() => { });
    }
    if (adapter2 && adapter2.pubClient) {
        await Promise.all([
            adapter2.pubClient.disconnect(),
            adapter2.subClient.disconnect()
        ]).catch(() => { });
    }

    // Chiudi socket e server HTTP
    if (io1) io1.close();
    if (io2) io2.close();
    if (httpServer1) await new Promise<void>((resolve) => httpServer1.close(() => resolve()));
    if (httpServer2) await new Promise<void>((resolve) => httpServer2.close(() => resolve()));

    // Chiudi connessione Redis
    if (redisClient) {
        await redisClient.disconnect();
    }
    if (redisServer) {
        await redisServer.stop();
    }

    // Chiudi connessione DB
    await disconnectDBForTesting();
});

beforeEach(async () => {
    await clearDBForTesting();
});

describe('Integration Tests: Distributed System (Redis & Editor)', () => {

    it('dovrebbe configurare correttamente il Redis Adapter su entrambe le istanze Socket.io', () => {
        expect(io1.of('/').adapter.constructor.name).toBe('RedisAdapter');
        expect(io2.of('/').adapter.constructor.name).toBe('RedisAdapter');
    });

    it('dovrebbe propagare correttamente lo stato di presenza online/offline tramite Redis', async () => {
        // Creazione utente mock nel DB
        const user = await UserModel.create({
            email: 'test_presence@example.com',
            passwordHash: 'secretpwd',
            firstName: 'Mario',
            lastName: 'Rossi'
        });

        const token = jwt.sign({ id: user._id.toString(), role: 'USER' }, JWT_SECRET);

        // Collegamento del Client A al Server 1
        const clientA = clientIo('http://localhost:3001', {
            auth: { token },
            transports: ['websocket']
        });

        await new Promise<void>((resolve, reject) => {
            clientA.on('connect', () => resolve());
            clientA.on('connect_error', (err) => reject(err));
        });

        // Attendiamo brevemente la sincronizzazione dei socket tra le istanze tramite Redis
        await new Promise(resolve => setTimeout(resolve, 200));

        // Interroghiamo PresenceManager (che userà ioInstance di Server 2, l'ultimo inizializzato)
        const isOnline = await PresenceManager.isUserOnline(user._id.toString());
        expect(isOnline).toBe(true);

        const onlineUsers = await PresenceManager.getOnlineUsers([user._id.toString()]);
        expect(onlineUsers.has(user._id.toString())).toBe(true);

        // Disconnetti il client
        clientA.disconnect();

        // PresenceManager.removeConnection ha un timeout di 3 secondi per gestire disconnessioni temporanee.
        // Attendiamo 3.5 secondi per verificare che diventi offline
        await new Promise(resolve => setTimeout(resolve, 3500));

        const isOnlineAfterDisconnect = await PresenceManager.isUserOnline(user._id.toString());
        expect(isOnlineAfterDisconnect).toBe(false);

        // Verifica che lastSeen sia stato aggiornato nel DB
        const updatedUser = await UserModel.findById(user._id);
        expect(updatedUser?.lastSeen).toBeDefined();
        expect(new Date(updatedUser!.lastSeen).getTime()).toBeGreaterThan(user.createdAt.getTime());
    });

    it('dovrebbe sincronizzare le modifiche CRDT (Yjs) tra client connessi a istanze server differenti', async () => {
        const user = await UserModel.create({
            email: 'test_sync@example.com',
            passwordHash: 'secretpwd',
            firstName: 'Luigi',
            lastName: 'Verdi'
        });

        const token = jwt.sign({ id: user._id.toString(), role: 'USER' }, JWT_SECRET);

        // Creazione di un documento nel database
        const doc = await DocumentModel.create({
            title: 'Doc Condiviso',
            ownerId: user._id,
            yjsState: Buffer.from(''),
            tiptapJson: {}
        });

        // Client A connesso a Server 1, Client B connesso a Server 2
        const clientA = clientIo('http://localhost:3001', { auth: { token }, transports: ['websocket'] });
        const clientB = clientIo('http://localhost:3002', { auth: { token }, transports: ['websocket'] });

        await Promise.all([
            new Promise<void>(resolve => clientA.on('connect', () => resolve())),
            new Promise<void>(resolve => clientB.on('connect', () => resolve()))
        ]);

        // Entrambi entrano nella stanza dello stesso documento
        clientA.emit('join-document', doc._id.toString());
        clientB.emit('join-document', doc._id.toString());

        // Attendiamo la ricezione dell'evento 'sync-document' (invio iniziale dello stato)
        await Promise.all([
            new Promise<void>(resolve => clientA.once('sync-document', () => resolve())),
            new Promise<void>(resolve => clientB.once('sync-document', () => resolve()))
        ]);

        // Creiamo un aggiornamento Yjs valido per Tiptap (XmlFragment invece di Text)
        const localYdoc = TiptapTransformer.toYdoc({
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello from Server 1' }]
            }]
        }, 'default');
        const yjsUpdate = Y.encodeStateAsUpdate(localYdoc);

        // Client A invia l'aggiornamento CRDT
        const updateReceivedPromise = new Promise<Uint8Array>((resolve) => {
            clientB.on('crdt-update', (update: any) => {
                resolve(new Uint8Array(update));
            });
        });

        clientA.emit('crdt-update', {
            documentId: doc._id.toString(),
            update: yjsUpdate
        });

        // Client B deve ricevere la stessa modifica passata attraverso il Redis Adapter
        const receivedUpdate = await updateReceivedPromise;
        expect(receivedUpdate).toEqual(yjsUpdate);

        // Pulizia
        clientA.disconnect();
        clientB.disconnect();
    });

    it('dovrebbe salvare correttamente lo stato finale su MongoDB alla disconnessione di tutti i client', async () => {
        const user = await UserModel.create({
            email: 'test_save@example.com',
            passwordHash: 'secretpwd',
            firstName: 'Peach',
            lastName: 'Princess'
        });

        const token = jwt.sign({ id: user._id.toString(), role: 'USER' }, JWT_SECRET);

        // Inseriamo un documento vuoto nel DB
        const doc = await DocumentModel.create({
            title: 'Doc Salva',
            ownerId: user._id,
            yjsState: Buffer.from(''),
            tiptapJson: {}
        });

        const client = clientIo('http://localhost:3001', { auth: { token }, transports: ['websocket'] });
        await new Promise<void>(resolve => client.on('connect', () => resolve()));

        client.emit('join-document', doc._id.toString());
        await new Promise<void>(resolve => client.once('sync-document', () => resolve()));

        // Applichiamo una modifica valida per Tiptap (XmlFragment invece di Text)
        const localYdoc = TiptapTransformer.toYdoc({
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello Auto-Save!' }]
            }]
        }, 'default');
        const yjsUpdate = Y.encodeStateAsUpdate(localYdoc);

        client.emit('crdt-update', {
            documentId: doc._id.toString(),
            update: yjsUpdate
        });

        // Attendiamo brevemente per consentire al server di elaborare l'evento crdt-update
        await new Promise(resolve => setTimeout(resolve, 200));

        // Disconnettiamo il client. La disconnessione dell'ultimo client triggererà l'auto-salvataggio su DB
        client.disconnect();

        // Attendiamo un secondo per dare tempo all'operazione DB asincrona di completarsi
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Controlliamo il DB
        const savedDoc = await DocumentModel.findById(doc._id);
        expect(savedDoc).toBeDefined();
        expect(savedDoc?.yjsState.length).toBeGreaterThan(0);

        // Ripristiniamo lo stato Yjs per validarne il contenuto tramite TiptapTransformer
        const finalYdoc = new Y.Doc();
        Y.applyUpdate(finalYdoc, new Uint8Array(savedDoc!.yjsState));
        const finalJson = TiptapTransformer.fromYdoc(finalYdoc, 'default');
        expect((finalJson as any).content[0].content[0].text).toBe('Hello Auto-Save!');
    });
});
