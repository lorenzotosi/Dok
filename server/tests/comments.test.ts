import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from './setup.js';

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
beforeEach(async () => await clearDBForTesting());

describe('Document Comments API', () => {
    let ownerToken = '';
    let editorToken = '';
    let commenterToken = '';
    let viewerToken = '';
    let strangerToken = '';

    let ownerId = '';
    let editorId = '';
    let commenterId = '';
    let viewerId = '';

    let documentId = '';

    beforeEach(async () => {
        const ownerRes = await request(app).post('/api/auth/register').send({
            email: 'owner@test.com',
            password: 'Password123!',
            firstName: 'Owner',
            lastName: 'User'
        });
        ownerToken = ownerRes.body.token;
        ownerId = ownerRes.body.user.id;

        const editorRes = await request(app).post('/api/auth/register').send({
            email: 'editor@test.com',
            password: 'Password123!',
            firstName: 'Editor',
            lastName: 'User'
        });
        editorToken = editorRes.body.token;
        editorId = editorRes.body.user.id;

        const commenterRes = await request(app).post('/api/auth/register').send({
            email: 'commenter@test.com',
            password: 'Password123!',
            firstName: 'Commenter',
            lastName: 'User'
        });
        commenterToken = commenterRes.body.token;
        commenterId = commenterRes.body.user.id;

        const viewerRes = await request(app).post('/api/auth/register').send({
            email: 'viewer@test.com',
            password: 'Password123!',
            firstName: 'Viewer',
            lastName: 'User'
        });
        viewerToken = viewerRes.body.token;
        viewerId = viewerRes.body.user.id;

        const strangerRes = await request(app).post('/api/auth/register').send({
            email: 'stranger@test.com',
            password: 'Password123!',
            firstName: 'Stranger',
            lastName: 'User'
        });
        strangerToken = strangerRes.body.token;

        const docRes = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Test Document', visibility: 'private' });
        
        documentId = docRes.body._id;

        await request(app)
            .put('/api/documents/share')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ id: documentId, email: 'editor@test.com', role: 'editor' });

        await request(app)
            .put('/api/documents/share')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ id: documentId, email: 'commenter@test.com', role: 'commenter' });

        await request(app)
            .put('/api/documents/share')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ id: documentId, email: 'viewer@test.com', role: 'viewer' });
    });

    describe('POST /api/documents/:id/comments', () => {
        it('dovrebbe consentire all\'owner di aggiungere un commento', async () => {
            const res = await request(app)
                .post(`/api/documents/${documentId}/comments`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'Commento dell\'owner' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.content).toBe('Commento dell\'owner');
            expect(res.body.userId._id).toBe(ownerId);
        });

        it('dovrebbe consentire a un editor di aggiungere un commento', async () => {
            const res = await request(app)
                .post(`/api/documents/${documentId}/comments`)
                .set('Authorization', `Bearer ${editorToken}`)
                .send({ content: 'Commento dell\'editor' });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe('Commento dell\'editor');
        });

        it('dovrebbe consentire a un commentatore di aggiungere un commento', async () => {
            const res = await request(app)
                .post(`/api/documents/${documentId}/comments`)
                .set('Authorization', `Bearer ${commenterToken}`)
                .send({ content: 'Commento del commentatore' });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe('Commento del commentatore');
        });

        it('non dovrebbe consentire a un viewer di aggiungere un commento', async () => {
            const res = await request(app)
                .post(`/api/documents/${documentId}/comments`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ content: 'Commento negato' });

            expect(res.status).toBe(403);
        });

        it('non dovrebbe consentire a un estraneo di aggiungere un commento su un doc privato', async () => {
            const res = await request(app)
                .post(`/api/documents/${documentId}/comments`)
                .set('Authorization', `Bearer ${strangerToken}`)
                .send({ content: 'Commento estraneo' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/documents/:id/comments/:commentId', () => {
        let commentId = '';

        beforeEach(async () => {
            const res = await request(app)
                .post(`/api/documents/${documentId}/comments`)
                .set('Authorization', `Bearer ${commenterToken}`)
                .send({ content: 'Commento da eliminare' });
            commentId = res.body._id;
        });

        it('dovrebbe consentire al creatore del commento di eliminarlo', async () => {
            const res = await request(app)
                .delete(`/api/documents/${documentId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${commenterToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
        });

        it('dovrebbe consentire all\'owner del documento di eliminare qualsiasi commento', async () => {
            const res = await request(app)
                .delete(`/api/documents/${documentId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
        });

        it('dovrebbe consentire ad un editor del documento di eliminare qualsiasi commento', async () => {
            const res = await request(app)
                .delete(`/api/documents/${documentId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${editorToken}`);

            expect(res.status).toBe(200);
        });

        it('non dovrebbe consentire ad un commentatore non creatore di eliminare il commento', async () => {
            const commenter2Res = await request(app).post('/api/auth/register').send({
                email: 'commenter2@test.com',
                password: 'Password123!',
                firstName: 'Commenter2',
                lastName: 'User'
            });
            const commenter2Token = commenter2Res.body.token;

            await request(app)
                .put('/api/documents/share')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ id: documentId, email: 'commenter2@test.com', role: 'commenter' });

            const res = await request(app)
                .delete(`/api/documents/${documentId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${commenter2Token}`);

            expect(res.status).toBe(403);
        });

        it('non dovrebbe consentire ad un viewer di eliminare il commento', async () => {
            const res = await request(app)
                .delete(`/api/documents/${documentId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(403);
        });
    });
});
