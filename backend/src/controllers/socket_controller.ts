import Debug from 'debug'
import { Socket } from 'socket.io'
import { ClientToServerEvents, NoticeData, ServerToClientEvents } from '../types/shared/SocketTypes'
import prisma from '../prisma'

const debug = Debug('FED22-API-KTV-GRUPP-3:socket_controller')

export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    debug('A user connected', socket.id)
}

