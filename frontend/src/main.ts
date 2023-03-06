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
const gameEl = document.querySelector("#game") as HTMLDivElement
const roomsEl = document.querySelector("#rooms") as HTMLDivElement
const gameBoardEl = document.querySelector(".game-board") as HTMLDivElement

let roomId: string | null = null
let username: string | null = null
let gameRound: number = 0

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

const showLobby = () => {
    loginEl.classList.add('hide')
    lobbyEl.classList.remove('hide')

    socket.emit("getRoomList", (rooms) => {
        console.log("Rooms:", rooms)
    
        roomsEl.innerHTML = rooms
            .filter(room => room.name !== "#lobby")
            .map((room) => {
                const userOne = room.users[0] ? room.users[0].name : "free";
                const userTwo = room.users[1] ? room.users[1].name : "free";
                return `
                <div class="room">
                    <p>${room.name}</p>
    
                    <div class="mb-3 usersInGame">
                        <div class="user">${userOne}</div>
                        <div class="user">${userTwo}</div>
                    </div>
    
                    <button class="btn btn-success" id="joinBtn" value="${room.id}">
                        JOIN GAME
                    </button>
                </div>
            `})
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

socket.on("startGame", (timeout, x, y) => {
    console.log("Game will start soon.")

    setTimeout(() => {
        gameBoardEl.innerHTML += `
            <div id="virus" style="position: absolute; top: ${y}px; left: ${x}px;">👾</div>
        `
    }, timeout)
})

socket.on("waitingForPlayers", (users) => {
    console.log("Waiting for a player to join...")
    console.log(users)
})

socket.on("updateGame", (newGameRound, timeout, x, y) => {
    // Increase gameRound by 1
    gameRound = newGameRound
    console.log("- NEXT ROUND -", gameRound)

    // Clear the board of virus
    gameBoardEl.innerHTML = ""

    // If 10 rounds have been played, emit gameOver to server
    if (gameRound === 10) {
        socket.emit("gameOver", socket.id)

        showLobby()
    }

    // Render new virus after timeout
    setTimeout(() => {
        gameBoardEl.innerHTML += `
            <div id="virus" style="position: absolute; top: ${y}px; left: ${x}px;">👾</div>
        `
    }, timeout)
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

        const gameBoardSize = {
            x: gameBoardEl.offsetWidth,
            y: gameBoardEl.offsetHeight
        }

        console.log(gameBoardSize, gameBoardEl.clientWidth, gameBoardEl.offsetWidth)

        socket.emit("userJoin", gameBoardSize ,username, roomId, (result) => {
            if (!result.success) {
                return alert(`Room with id ${roomId} is full.`)
            }

            showGameView()
        })
    }
})

gameBoardEl.addEventListener("click", e => {
    const target = e.target as HTMLDivElement

    if (target.id === "virus") {
        console.log("User " + socket.id + " clicked the virus!")

        const gameBoardSize = {
            x: gameBoardEl.offsetWidth,
            y: gameBoardEl.offsetHeight
        }

        socket.emit("virusClicked", gameBoardSize, gameRound, socket.id)
    }
})