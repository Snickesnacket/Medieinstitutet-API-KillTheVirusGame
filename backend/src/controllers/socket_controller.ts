import Debug from "debug";
import { Socket, Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/shared/SocketTypes";
import prisma from "../prisma";
import { getUsersInRoom } from "../services/UserService";

const debug = Debug("FED22-API-KTV-GRUPP-3:socket_controller");

export const handleConnection = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
  debug("A user connected", socket.id);

  socket.on("getRoomList", async (callback) => {
    const rooms = await prisma.room.findMany({
      include: {
        users: true,
      },
    });

    callback(rooms);
  });

  socket.on("userJoin", async (gameBoardSize, username, roomId, callback) => {
    debug("🆕 %s joined room: %s", username, roomId);

    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
      include: {
        users: true,
      },
    });

    socket.join(roomId);

    const user = await prisma.user.update({
      where: {
        id: socket.id,
      },
      data: {
        roomId: roomId,
      },
    });

    const usersInRoom = await getUsersInRoom(roomId);
    const namesInRoom = await getNamesInRoom(roomId);

    if (!room) {
      return callback({
        success: false,
        data: null,
      });
    }

    if (usersInRoom.length > 2) {
      return callback({
        success: false,
        data: null,
      });
    }

    const x = Math.floor(Math.random() * gameBoardSize.x);
    const y = Math.floor(Math.random() * gameBoardSize.y);
    const timeout = Math.floor(Math.random() * (5000 - 1000 * 1) + 1000);

    io.to(roomId).emit("userNames", namesInRoom);

    if (usersInRoom.length >= 2) {
      io.to(roomId).emit("startGame", timeout, x, y);
    } else {
      io.to(roomId).emit("waitingForPlayers", usersInRoom);
    }

    callback({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        users: usersInRoom,
      },
    });

    const games = await prisma.game.findMany()
    io.emit("updateLobby", games);
  });

  const getNamesInRoom = async (roomId: string) => {
    const users = await prisma.user.findMany({
      where: {
        roomId,
      },
    });

    return users;
  };

  socket.on("createUser", async (username, callback) => {
    const found = await prisma.user.findUnique({
      where: {
        name: username,
      },
    });

    if (found) {
      return;
    }

    const user = await prisma.user.upsert({
      where: {
        id: socket.id,
      },
      create: {
        id: socket.id,
        name: username,
        speed: 0,
        score: 0,
        highScore:0,
        roomId: "63ff434d4572c0af47e2782b",
      },
      update: {
        name: username,
      },
    });

    callback({
      success: true,
      data: {
        id: socket.id,
        name: username,
        users: [],
      },
    });
  });

  socket.on("disconnect", async () => {
    debug("A user disconnected", socket.id);

    const user = await prisma.user.findUnique({
      where: {
        id: socket.id,
      },
    });
    if (!user) {
      return;
    }

    await prisma.user.update({
      where: {
        id: socket.id,
      },
      data: {
        roomId: "63ff434d4572c0af47e2782b",
      },
    });

    socket.join("63ff434d4572c0af47e2782b");
    const users = await getUsersInRoom(user.roomId);
  });

  socket.on(
    "virusClicked",
    async (gameBoardSize, gameRound, reactionTime, socketId) => {
      gameRound++;

      const user = await prisma.user.update({
        where: {
          id: socketId,
        },
        data: {
          speed: reactionTime,
        },
      });

      const users = await prisma.user.findMany({
        where: {
          roomId: user.roomId,
        },
      });

      if (!user) {
        return;
      }

      if (users[0].speed > 0 && users[1].speed > 0) {
        const x = Math.floor(Math.random() * gameBoardSize.x);
        const y = Math.floor(Math.random() * gameBoardSize.y);
        const timeout = Math.floor(Math.random() * (5000 - 1000 * 1) + 1000);

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
        });

        if (!_user) {
          return;
        }

       
        const roomUsers = _user.room.users;
        // Define an array to store all the reaction times of both players
        let reactionTimes: number[] = [];
         console.log("hi", users[0].speed)
        console.log("hello", users[1].speed)  

        if (roomUsers[1].speed > 0 && roomUsers[0].speed > 0) {

            socket.on("reactionTime", async (reactionTime) => {
            // Find the user associated with the given socket ID
            const user = await prisma.user.findUnique({
              where: {
                id: socketId,
              },
            });

            if (user) {
              // Push the reaction time to the array
              reactionTimes.push(reactionTime);

                console.log('is this working?',reactionTime)

              // Calculate the average reaction time after every round
               const avgReactionTime = reactionTimes.length > 0 ? reactionTimes.reduce((acc, time) => acc + time, 0) / reactionTimes.length : 0;


              // Update the user's high score in the database
              await prisma.user.update({
                where: {
                  id: socketId,
                },
                data: {
                  highScore: avgReactionTime,
                },
              });
            }

              const users = await prisma.user.findMany({
              where: {
                highScore: {
                  gt: 0 
                }
              },
              orderBy: {
                highScore: 'asc' 
              },
              take: 1 
            })
               let previousHighScore: any | null = null;

              if (users.length > 0) {
                const currentHighScore = users[0].highScore; 
                const currentUsername = users[0]?.name;
          
                if (previousHighScore === null || currentHighScore !== previousHighScore) {
                  socket.emit('lowestHighScoreUser', currentUsername, currentHighScore!); 
                  previousHighScore = { username: currentUsername, highScore: currentHighScore };
                }
              }
          });

          const [fastestUser, secondFastestUser] =
            roomUsers[1].speed < roomUsers[0].speed
              ? [users[0], users[1]]
              : [users[1], users[0]];

          await prisma.user.update({
            where: {
              id: fastestUser.id,
            },
            data: {
              score: {
                increment: fastestUser.id === socketId ? 1 : 0,
              },
            },
          });

          const allUsers = await prisma.user.findMany({
            where: {
              roomId: user.roomId,
            },
          });

          io.to(user.roomId).emit(
            "updateGame",
            allUsers,
            gameRound,
            timeout,
            x,
            y
          );

          await prisma.user.updateMany({
            where: {
              roomId: user.roomId,
            },
            data: {
              speed: 0,
            },
          });
        }

        const games = await prisma.game.findMany()

        io.emit("updateLobby", games);

        const updatedRoomUsers = await prisma.user.findMany({
          where: {
            roomId: user.roomId,
          },
        });
      }
    }
  );

  socket.on("gameOver", async (socketId) => {
    const _user = await prisma.user.findUnique({
      where: {
        id: socketId
      }
    })

    if (!_user) {
      return
    }

    const users = await prisma.user.findMany({
      where: {
        roomId: _user.roomId
      }
    })

    console.log(users)

      const game = await prisma.game.create({
        data: {
          users: [users[0].name, users[1].name],
          scores: [users[0].score, users[1].score]
        }
      })

      console.log(game)

    // Update user.roomId to the lobbyId & speed to 0
    const user = await prisma.user.update({
      where: {
        id: socketId,
      },
      data: {
        speed: 0,
        score: 0,
        roomId: "63ff434d4572c0af47e2782b",
      },
    });

    // User joins lobby room
    socket.join("63ff434d4572c0af47e2782b");

    const games = await prisma.game.findMany()
    io.emit("updateLobby", games);
  });
};
