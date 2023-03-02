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

        const user = await prisma.user.update({
            where: {
                id: socket.id
            },
            data: {
                roomId: roomId
            }
        })

        const usersInRoom = await getUsersInRoom(roomId)

        if (!room) {
            return callback({
                success: false,
                data: null,
            })
        }

        if (usersInRoom.length > 1) {
            return callback({
                success: false,
                data: null
            })
        }

        // const notice: NoticeData = {
        //     username,
        // }

        socket.join(roomId)

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

    socket.on("createUser", async (username, callback) => {
        console.log("User:", username, socket.id);

        const found = await prisma.user.findUnique({
            where: {
                name: username
            }
        })

        if (found) {
            return
        }

        const user = await prisma.user.upsert({
            where: {
                id: socket.id
            },
            create: {
                id: socket.id,
                name: username,
                speed: 0,
                roomId: "63ff434d4572c0af47e2782b"
            },
            update: {
                name: username
            }
        })

        callback({
            success: true,
            data: {
                id: socket.id,
                name: username,
                users: []
            }
        })
    })

    socket.on('disconnect', () => {
        debug('A user disconnected', socket.id)
    })
}

