import Debug from 'debug'
import { Socket } from 'socket.io'
import { ClientToServerEvents, NoticeData, ServerToClientEvents } from '../types/shared/SocketTypes'
import prisma from '../prisma'

const debug = Debug('FED22-API-KTV-GRUPP-3:socket_controller')

export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    debug('A user connected', socket.id)

    socket.on('getRoomList', async (callback) => {
        const rooms = await prisma.room.findMany()

        debug('Got request for rooms, sending room list %o', rooms)
        
        setTimeout(() => {
            callback(rooms)
        }, 1500)
    })

    socket.on('userJoin', async (username, roomId, callback) => {
        debug('user %s wants to join the room %s', username, roomId)

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

        const notice: NoticeData = {
            username,
        }

        socket.join(roomId)

        socket.broadcast.to(roomId).emit('userJoined', notice)

        callback({
            success: true,
            data: {
                id: room.id,
                name: room.name,
                users: [],
            }
        })
    })

    socket.on('disconnect', () => {
        debug('A user disconnected', socket.id)
    })
}

