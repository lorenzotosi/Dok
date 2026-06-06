import { Server, Socket } from 'socket.io';

export const registerAdminHandlers = (io: Server, socket: Socket) => {
    const userRole = socket.data.user?.role;

    socket.on('join_admin_dashboard', (callback?: () => void) => {
        if (userRole === 'ADMIN') {
            socket.join('admin:dashboard');
            console.log(`[ACL] Admin ${socket.data.user?.id} iscritto alla Dashboard.`);
            if (callback) callback();
        } else {
            console.warn(`[Security] L'utente ${socket.data.user?.id} ha tentato un accesso non autorizzato alla Dashboard!`);
        }
    });

    socket.on('leave_admin_dashboard', () => {
        socket.leave('admin:dashboard');
    });

    socket.on('join_admin_document_logs', ({ documentId }: { documentId: string }) => {
        if (userRole === 'ADMIN') {
            socket.join(`admin_logs:${documentId}`);
            console.log(`[Admin] Socket ${socket.id} monitora i log del documento ${documentId}`);
        } else {
            console.warn(`[Security] L'utente ${socket.data.user?.id} ha tentato un accesso non autorizzato ai log!`);
        }
    });

    socket.on('leave_admin_document_logs', ({ documentId }: { documentId: string }) => {
        socket.leave(`admin_logs:${documentId}`);
    });
};