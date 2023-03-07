import Debug from 'debug'
import { Socket, Server } from 'socket.io'
import { ClientToServerEvents, NoticeData, ServerToClientEvents } from '../types/shared/SocketTypes'
import prisma from '../prisma'
import { getUsersInRoom } from '../services/UserService'

const debug = Debug('FED22-API-KTV-GRUPP-3:socket_controller')

export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>, io: Server<ClientToServerEvents, ServerToClientEvents>) => {
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

    socket.on('userJoin', async (gameBoardSize, username, roomId, callback) => {
        debug("🆕 %s joined room: %s", username, roomId)

        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
            }, 
            include: {
                users: true
            }
        })

        socket.join(roomId)

        const user = await prisma.user.update({
            where: {
                id: socket.id
            },
            data: {
                roomId: roomId
            }
        })

        const usersInRoom = await getUsersInRoom(roomId)
        const namesInRoom = await getNamesInRoom(roomId)

        // socket.broadcast.to(roomId).emit('onlineUsers', usersInRoom)

        if (!room) {
            return callback({
                success: false,
                data: null,
            })
        }

        if (usersInRoom.length > 2) {
            return callback({
                success: false,
                data: null
            })
        }

        const x = Math.floor(Math.random() * gameBoardSize.x)
        const y = Math.floor(Math.random() * gameBoardSize.y)
        const timeout = Math.floor(Math.random() * (5000 - 1000 * 1) + 1000)

        io.to(roomId).emit('userNames', namesInRoom)

        console.log(timeout)
        console.log(gameBoardSize, x, y)

        if (usersInRoom.length >= 2) {
            io.to(roomId).emit("startGame", timeout, x, y)
        } else {
            io.to(roomId).emit("waitingForPlayers", usersInRoom)
        }

        callback({
            success: true,
            data: {
                id: room.id,
                name: room.name,
                users: usersInRoom,
            }
        })
    })

    const getNamesInRoom = async (roomId : string) => {
        const users = await prisma.user.findMany({
            where: {
                roomId
            }
        })

        return users
    }

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
                score: 0,
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

    socket.on('disconnect', async () => {
        debug('A user disconnected', socket.id)

        const user = await prisma.user.findUnique({
            where: {
                id: socket.id,
            }
        })
        if (!user) {
            return
        }

        await prisma.user.update({
            where: {
                id: socket.id
            },
            data: {
                roomId: '63ff434d4572c0af47e2782b',
            }
        })

        socket.join('63ff434d4572c0af47e2782b')
        const users = await getUsersInRoom(user.roomId)
    })

    socket.on("virusClicked", async (gameBoardSize, gameRound, reactionTime, socketId) => {
        gameRound++

        const user = await prisma.user.update({
            where: {
                id: socketId
            },
            data: {
                speed: reactionTime,
            }
        })

        const users = await prisma.user.findMany({
            where: {
                roomId: user.roomId
            }
        })

        if (!user) {
            return
        }

        if (users[0].speed > 0 && users[1].speed > 0) {
            const x = Math.floor(Math.random() * gameBoardSize.x)
            const y = Math.floor(Math.random() * gameBoardSize.y)
            const timeout = Math.floor(Math.random() * (5000 - 1000 * 1) + 1000)

            const _user = await prisma.user.update({
                where: {
                  id: socketId,
                },
                data: {
                  speed: reactionTime,
                },
                include: {
                  room: {
                    select: {
                      users: {
                        select: {
                          id: true,
                          speed: true,
                          score: true,
                        },
                      },
                    },
                  },
                },
              })
            
              if (!_user) {
                return
              }
            
              const roomUsers = _user.room.users
              console.log(roomUsers)
              if (roomUsers[1].speed > 0 && roomUsers[0].speed > 0) {
                const [fastestUser, secondFastestUser] =
                  roomUsers[1].speed < roomUsers[0].speed
                    ? [users[0], users[1]]
                    : [users[1], users[0]]

                    await prisma.user.update({
                        where: {
                            id: fastestUser.id,
                        },
                        data: {
                            score: {
                                increment: fastestUser.id === socketId ? 1 : 0,
                            },
                        }
                    })

                const allUsers = await prisma.user.findMany({
                    where: {
                        roomId: user.roomId
                    }
                })
                io.to(user.roomId).emit("updateGame", allUsers, gameRound, timeout, x, y)
          
                await prisma.user.updateMany({
                  where: {
                    roomId: user.roomId,
                  },
                  data: {
                    speed: 0,
                  },
                })
              }

              const updatedRoomUsers = await prisma.user.findMany({
                where: {
                  roomId: user.roomId,
                },
              })
              console.log(updatedRoomUsers)
            }
        })


    socket.on("gameOver", async (socketId) => {
        // Update user.roomId to the lobbyId & speed to 0
        const user = await prisma.user.update({
            where: {
                id: socketId
            }, 
            data: {
                speed: 0,
                score: 0,
                roomId: "63ff434d4572c0af47e2782b"
            }
        })

        // User joins lobby room
        socket.join("63ff434d4572c0af47e2782b")
    })
}

