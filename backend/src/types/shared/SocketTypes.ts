import { Room, User } from "@prisma/client";
export {};

export interface ServerToClientEvents {
  userJoined: (user: User[]) => void;
  startGame: (timeout: number, x: number, y: number) => void;
  waitingForPlayers: (users: User[]) => void;
  updateGame: (
    users: User[],
    newGameRound: number,
    timeout: number,
    x: number,
    y: number
  ) => void;
  userNames: (users: User[]) => void;
}

export interface ClientToServerEvents {
  getRoomList: (callback: (rooms: RoomInfoData[]) => void) => void;
  userJoin: (
    gameBoardSize: { x: number; y: number },
    username: string,
    roomId: string,
    callback: (result: UserJoinResult) => void
  ) => void;
  createUser: (
    username: string,
    callback: (result: UserJoinResult) => void
  ) => void;
  virusClicked: (
    gameBoardSize: { x: number; y: number },
    gameRound: number,
    reactionTime: number,
    socketId: string
  ) => void;
  gameOver: (socketId: string) => void;
}

export interface RoomInfoData extends Room {
  users: User[];
}

export interface UserJoinResult {
  success: boolean;
  data: RoomInfoData | null;
}
