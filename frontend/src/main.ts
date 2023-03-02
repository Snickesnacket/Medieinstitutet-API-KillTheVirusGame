import "./assets/scss/style.scss";
import { io, Socket } from 'socket.io-client'
import {
	ClientToServerEvents,
	ServerToClientEvents,
    User,
} from '../../backend/src/types/shared/SocketTypes'


const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST

const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement
const loginEl = document.querySelector('#login') as HTMLDivElement
const lobbyEl = document.querySelector('#lobby') as HTMLDivElement
const gameEl = document.querySelector("#game") as HTMLDivElement
const roomsEl = document.querySelector("#rooms") as HTMLDivElement

let roomId: string | null = null
let username: string | null = null


const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

const showLobby = () => {
    loginEl.classList.add('hide')
    lobbyEl.classList.remove('hide')

    socket.emit("getRoomList", (rooms) => {
        console.log("Rooms:", rooms)
    
        roomsEl.innerHTML = rooms
            .filter(room => room.name !== "#lobby")
            .map((room) => `
                <div class="room">
                    <p>${room.name}</p>
    
                    <div class="mb-3 usersInGame">
                        <div class="user">USER 1: 1</div>
                        <div class="user">USER 2: 4</div>
                    </div>
    
                    <button class="btn btn-success" id="joinBtn" value="${room.id}">
                        JOIN GAME
                    </button>
                </div>
            `)
            .join("")
    })
}

const showLoginView = () => {
    loginEl.classList.remove('hide')
}

const showGameView = () => {
    lobbyEl.classList.add("hide")
    gameEl.classList.remove("hide")
}

socket.on('connect', () => {
	console.log('Connected To Server', socket.id)

	showLoginView()
})

socket.on('disconnect', () => {
    console.log('User disconnected', socket.id)
})

const updateOnlineUsers = (users: User[]) => {
    console.log("updateOnlineUsers:", users)
}

socket.on('onlineUsers', (users) => {
    updateOnlineUsers(users)
})


usernameFormEl.addEventListener('submit', e => {
    e.preventDefault()

    username = (usernameFormEl.querySelector('#username') as HTMLInputElement).value.trim()
    
    socket.emit("getRoomList", (rooms) => {
        roomId = rooms[0].id
    })

    if (!username) {
        return
    }

    socket.emit("createUser", username, (result) => {
        console.log("join:", result);

        if (!result.success || !result.data) {
            alert("No access.")
            return
        }

        const roomInfo = result.data
        console.log(roomInfo)

        showLobby()
    })
})

roomsEl.addEventListener("click", e => {
    const target = e.target as HTMLButtonElement

    if (target.tagName === "BUTTON") {
        roomId = target.value
        console.log(`User ${username} with socket.id ${socket.id} wants to join room ${roomId}`)

        if (!username) {
            return
        }

        socket.emit("userJoin", username, roomId, (result) => {
            if (!result.success) {
                return console.log(`Room with id ${roomId} is full.`)
            }

            console.log("User joined room:", roomId, result)

            showGameView()
            
        })
    }
})