import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Swagger Documentation API', () => {
    it('dovrebbe servire la pagina HTML di Swagger UI su /api-docs/', async () => {
        const response = await request(app).get('/api-docs/');
        expect(response.status).toBe(200);
        expect(response.text).toContain('swagger');
    });

    it('dovrebbe fare redirect o servire da /api-docs', async () => {
        const response = await request(app).get('/api-docs');
        expect([200, 301, 302]).toContain(response.status);
    });
});
