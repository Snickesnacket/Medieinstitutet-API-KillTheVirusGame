import "./assets/scss/style.scss";
import { io, Socket } from 'socket.io-client'
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from '@backend/types/shared/SocketTypes'


const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST

const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement

let username: string | null = null

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

usernameFormEl.addEventListener('submit', e => {
    e.preventDefault()

    username = (usernameFormEl.querySelector('#username') as HTMLInputElement).value.trim()

    if (!username) {
        return
    }

    socket.emit('userJoin', username, () => {
        console.log('Success?', )
    })
})