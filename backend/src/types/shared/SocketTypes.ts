import { Room, User, Result} from '@prisma/client'
export {}

export interface ServerToClientEvents {
userJoined: (notice: NoticeData) => void
}

export interface ClientToServerEvents {
    getRoomList: (callback: (rooms: Room[]) => void) => void
    userJoin: (username: string, roomId: string, callback: (result: UserJoinResult) => void) => void
}

export interface InterServerEvents {
}

export interface NoticeData {
    username: string
}

export interface RoomInfoData extends Room {
    users: User[]
}

export interface UserJoinResult {
	success: boolean
	data: RoomInfoData | null
}
