import { io, Socket } from 'socket.io-client';

class SocketClientService {
    private socket: Socket | null = null;

    connect(token?: string | null): void {
        if (this.socket) {
            const currentToken = (this.socket.auth as any)?.token;
            if (this.socket.connected && currentToken === token) {
                return;
            }
            this.socket.disconnect();
        }

        this.socket = io('http://localhost:3000', {
            auth: { token: token || null },
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connesso con ID:', this.socket?.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('[Socket] Disconnesso. Motivo:', reason);
        });

        this.socket.on('connect_error', (err) => {
            console.error('[Socket] Errore di connessione:', err.message);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketClientService();