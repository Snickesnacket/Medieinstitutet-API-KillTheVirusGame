import Debug from 'debug'
import { Socket } from 'socket.io'
import { ClientToServerEvents, NoticeData, ServerToClientEvents } from '../types/shared/SocketTypes'
import prisma from '../prisma'
import { getUsersInRoom } from '../services/UserService'

const debug = Debug('FED22-API-KTV-GRUPP-3:socket_controller')

export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    debug('A user connected', socket.id)

    socket.on('getRoomList', async (callback) => {
        const rooms = await prisma.room.findMany({
            include: {
                users: true
            }
        })

        debug('Got request for rooms, sending room list %o', rooms)
        
        callback(rooms)
    })

    socket.on('userJoin', async (username, roomId, callback) => {
        debug("🆕 %s joined room: %s", username, roomId)

        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
            }
        })

        if (!room) {
            return callback({
                success: false,
                data: null,
            })
        }

        // const notice: NoticeData = {
        //     username,
        // }

        socket.join(roomId)

        const usersInRoom = await getUsersInRoom(roomId)

        // socket.broadcast.to(roomId).emit('userJoined', notice)

        callback({
            success: true,
            data: {
                id: room.id,
                name: room.name,
                users: usersInRoom,
            }
        })
    })

    socket.on('disconnect', () => {
        debug('A user disconnected', socket.id)
    })
}

