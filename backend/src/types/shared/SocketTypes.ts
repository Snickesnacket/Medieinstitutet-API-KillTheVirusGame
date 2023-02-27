import { Room, User, Result} from '@prisma/client'
export {}

export interface ServerToClientEvents {
userJoined: (notice: NoticeData) => void
}

export interface ClientToServerEvents {
    getRoomList: (callback: (rooms: Room[]) => void) => void
    userJoin: (username: string, roomId: string) => void
}

export interface NoticeData {
    username: string
}