import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from './setup.js';
import { UserModel } from '../src/models/User.js';

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());

beforeEach(async () => await clearDBForTesting());

describe('Authentication API', () => {

    const mockUser = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Mario',
        lastName: 'Rossi'
    };

    describe('POST /api/auth/register', () => {
        it('dovrebbe registrare un nuovo utente e restituire il token', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(mockUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(mockUser.email);

            // Assicuriamoci che non restituisca la password!
            expect(response.body.user).not.toHaveProperty('passwordHash');
            expect(response.body.user).not.toHaveProperty('password');

            // Verifica che l'utente sia stato effettivamente salvato nel DB in RAM
            const userInDb = await UserModel.findOne({ email: mockUser.email });
            expect(userInDb).toBeTruthy();
        });

        it('dovrebbe fallire se la mail è già in uso', async () => {
            // Inseriamo il primo
            await request(app).post('/api/auth/register').send(mockUser);

            // Riproviamo con gli stessi dati
            const response = await request(app)
                .post('/api/auth/register')
                .send(mockUser);

            expect(response.status).toBe(409); // Bad Request (400) o Conflict (409)
        });
    });

    describe('POST /api/auth/login', () => {
        // Prepariamo un utente prima di testare il login
        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(mockUser);
        });

        it('dovrebbe fare login con credenziali corrette', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: mockUser.email, password: mockUser.password });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('dovrebbe fallire con password errata', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: mockUser.email, password: 'WrongPassword' });

            expect(response.status).toBe(401); // Unauthorized
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Middleware di Protezione Rotte', () => {
        let token = '';

        beforeEach(async () => {
            const res = await request(app).post('/api/auth/register').send(mockUser);
            token = res.body.token;
        });

        // Supponiamo di avere una rotta finta /api/auth/me protetta da requireAuth
        it('dovrebbe accettare una richiesta con token valido', async () => {
            const response = await request(app)
                .get('/api/auth/me') // Da sostituire con una rotta reale
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).not.toBe(401);
        });

        it('dovrebbe rifiutare una richiesta senza token', async () => {
            const response = await request(app).get('/api/auth/me'); // Niente .set()
            expect(response.status).toBe(401);
        });

        it('dovrebbe rifiutare una richiesta con token malformato', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer fake-invalid-token`);

            expect(response.status).toBe(401);
        });
    });
});