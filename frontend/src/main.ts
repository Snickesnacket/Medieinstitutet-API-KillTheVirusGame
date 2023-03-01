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
const roomsEl = document.querySelector("#rooms") as HTMLDivElement
const joinedBtnEl = document.querySelector('#joinBtn') as HTMLButtonElement
const speldivEl = document.querySelector('#rooms') as HTMLDivElement

let roomId: string | null = null
let username: string | null = null


const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

const showLobby = () => {
    loginEl.classList.add('hide')
    lobbyEl.classList.remove('hide')

    socket.emit("getRoomList", (rooms) => {
        console.log("Rooms:", rooms)
    
        roomsEl.innerHTML = rooms
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

socket.on('connect', () => {
	console.log('Connected To Server', socket.id)

	showLoginView()
})

socket.on('disconnect', () => {
    console.log('User disconnected', socket.id)
})

socket.emit("getRoomList", (rooms) => {
    console.log("Rooms:", rooms);

    roomId = rooms[0].id
})

usernameFormEl.addEventListener('submit', e => {
    e.preventDefault()

    username = (usernameFormEl.querySelector('#username') as HTMLInputElement).value.trim()

    if (!username) {
        return
    }

    socket.emit("userJoin", username, roomId!, (result) => {
        console.log("join:", result);

        if (!result.success || !result.data) {
            alert("No access.")
            return
        }

        const roomInfo = result.data

        showLobby()
    })
})

const updateOnlineUsers = (users: User[]) => {

	console.log("updateOnlineUsers:", users)

	roomsEl.innerHTML = users
		.map(user =>
			user.id === socket.id
				? ` <div class="user">${user.name}</div> `
				:  ` <div class="user">${user.name}</div> `
		)
		.join('')
}



//TODO: DONT JOIN USER IF ROOM ALREADY HAS 2 USERS! 
// DONT 

speldivEl.addEventListener('click', e => {
    const target = e.target as HTMLButtonElement

    if (target.tagName == "BUTTON") {
         e.preventDefault
    // Get username
	roomId = target.value  //(joinedBtnEl.querySelector('#joinBtbn') as HTMLSelectElement).value
	username = (usernameFormEl.querySelector('#username') as HTMLInputElement).value.trim()
    console.log( target.tagName)

	// If user or room dosent exit - return. 
	if (!username || !roomId) {
		return
    }
         loginEl.classList.add('hide')
         lobbyEl.classList.add('hide')
   

            socket.emit('userJoin', username, roomId, (result) => {
            console.log("Join was success?", result)

            if (!result.success || !result.data) {
                alert("NO ACCESS 4 US")
                return
            }
            updateOnlineUsers(username)

            const roomInfo = result.data

            console.log("roominfo",roomInfo)

            // Update chat view title with room name
          /*   const chatTitleEl = document.querySelector('#chat-title') as HTMLHeadingElement
            chatTitleEl.innerText = roomInfo.name */

            // Yay we're allowed to join
            console.log("Showing chat view")
            //showChatView() 
        })
	/* console.log("Emitted 'userJoin' event to server", username) */

    }
   
})