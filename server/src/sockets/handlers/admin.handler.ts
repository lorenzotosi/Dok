import { Server, Socket } from 'socket.io';

export const registerAdminHandlers = (io: Server, socket: Socket) => {
    const userRole = socket.data.user?.role;

    socket.on('join_admin_dashboard', (callback?: () => void) => {
        if (userRole === 'ADMIN') {
            socket.join('admin:dashboard');
            console.log(`[ACL] Admin ${socket.data.user?.id} iscritto alla Dashboard.`);
            if (callback) callback();
        }
    });

    socket.on('leave_admin_dashboard', () => {
        socket.leave('admin:dashboard');
    });

    socket.on('join-public-dashboard', () => {
        socket.join('global-dashboard');
    });
};