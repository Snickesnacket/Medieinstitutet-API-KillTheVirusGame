import { Room, User } from '@prisma/client'
export { Room, User}

export interface ServerToClientEvents {
    userJoined: (notice: NoticeData) => void
    onlineUsers: (users: User[]) => void
}

export interface ClientToServerEvents {
    getRoomList: (callback: (rooms: RoomInfoData[]) => void) => void
    userJoin: (username: string, roomId: string, callback: (result: UserJoinResult) => void) => void
    createUser: (username: string, callback: (result: UserJoinResult) => void) => void
}

export interface InterServerEvents {
}

export interface NoticeData {

}

export interface InterServerEvents {

}

export interface RoomInfoData extends Room {
    users: User[]
}

export interface UserJoinResult {
	success: boolean
	data: RoomInfoData | null
}
