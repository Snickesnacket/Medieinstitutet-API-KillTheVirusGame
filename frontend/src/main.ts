import "./assets/scss/style.scss";
import { io, Socket } from 'socket.io-client'
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from '../../backend/src/types/shared/SocketTypes'


const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST

const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement
const loginEl = document.querySelector('#login') as HTMLDivElement
const lobbyEl = document.querySelector('#lobby') as HTMLDivElement

let roomId: string | null = null
let username: string | null = null

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

const showLobby = () => {
    loginEl.classList.add('hide')
    console.log("Hello")
    lobbyEl.classList.remove('hide')
}

usernameFormEl.addEventListener('submit', e => {
    e.preventDefault()

    username = (usernameFormEl.querySelector('#username') as HTMLInputElement).value.trim()

    if (!username) {
        console.log("Insert Name")
        return
    }

    showLobby()
})