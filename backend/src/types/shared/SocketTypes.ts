export {}

export interface ServerToClient {
userJoined: (notice: NoticeData) => void
}

export interface ClientToServerEvents {
    
}

export interface NoticeData {
    username: string
}