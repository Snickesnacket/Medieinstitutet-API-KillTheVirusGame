import "./assets/scss/style.scss";
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../backend/src/types/shared/SocketTypes";

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST;

const usernameFormEl = document.querySelector(
  "#username-form"
) as HTMLFormElement;
const loginEl = document.querySelector("#login") as HTMLDivElement;
const lobbyEl = document.querySelector("#lobby") as HTMLDivElement;
const gameEl = document.querySelector("#game") as HTMLDivElement;
const roomsEl = document.querySelector("#rooms") as HTMLDivElement;
const gameBoardEl = document.querySelector(".game-board") as HTMLDivElement;

const userOneEl = document.querySelector("#userOne") as HTMLSpanElement;
const userTwoEl = document.querySelector("#userTwo") as HTMLSpanElement;

const userOneNameEl = document.querySelector("#userOneName") as HTMLSpanElement;
const userTwoNameEl = document.querySelector("#userTwoName") as HTMLSpanElement;

const userOneTimeEl = document.querySelector("#userOneTime") as HTMLSpanElement;
const userTwoTimeEl = document.querySelector("#userTwoTime") as HTMLSpanElement;

const scoreResultEl = document.querySelector(
  ".score-result"
) as HTMLSpanElement;

let roomId: string | null = null;
let username: string | null = null;
let gameRound: number = 0;

// Time of virus render (createdTime) & time-to-click virus (clickTime)
let createdTime: number = 0;
let clickTime: number = 0;

// Live counter
let counter: number = 0;
let intervalId: number;
const counterEl = document.querySelector(".counter") as HTMLSpanElement;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

  const startCounter = () => {
    const incrementTime = 1000 / (1 / 0.001); 
  
    let lastTime = Date.now();
    intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;
      lastTime = now;
  
      counter += elapsed * 0.001 / incrementTime;
  
      counterEl.innerText = counter.toFixed(3);
    }, 1);
  };

const stopCounter = () => {
  clearInterval(intervalId);
};

const resetCounter = () => {
  counter = 0;
  counterEl.innerText = counter.toFixed(3);
};

const showLobby = () => {
  loginEl.classList.add("hide");
  lobbyEl.classList.remove("hide");
  gameEl.classList.add("hide");

  socket.emit("getRoomList", (rooms) => {
    roomsEl.innerHTML = rooms
      .filter((room) => room.name !== "#lobby")
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
            `;
      })
      .join("");
  });
};

const showLoginView = () => {
  loginEl.classList.remove("hide");
};

const showGameView = () => {
  lobbyEl.classList.add("hide");
  gameEl.classList.remove("hide");
};

socket.on("connect", () => {
  console.log("Connected To Server", socket.id);

  showLoginView();
});

socket.on("disconnect", () => {
  console.log("User disconnected", socket.id);
});

socket.on("updateLobby", () => {
  socket.emit("getRoomList", (rooms) => {
    roomsEl.innerHTML = rooms
      .filter((room) => room.name !== "#lobby")
      .map((room) => {
        const userOne = room.users[0] ? room.users[0].name : "free";
        const userOneScore = room.users[1] ? room.users[1].score : 0;
        const userTwo = room.users[1] ? room.users[1].name : "free";
        const userTwoScore = room.users[0] ? room.users[0].score : 0;

        return `
                <div class="room">
                    <p>${room.name}</p>
    
                    <div class="mb-3 usersInGame">
                        <div class="user">${userOne}: ${userOneScore}</div>
                        <div class="user">${userTwo}: ${userTwoScore}</div>
                    </div>
    
                    <button class="btn btn-success" id="joinBtn" value="${room.id}">
                        JOIN GAME
                    </button>
                </div>
            `;
      })
      .join("");
  });
});

socket.on("startGame", (timeout, x, y) => {
  console.log("Game will start soon.");

  setTimeout(() => {
    gameBoardEl.innerHTML += `
            <div id="virus" style="position: absolute; top: ${y}px; left: ${x}px;">👾</div>
        `;
    stopCounter();
    resetCounter();
    startCounter();

    createdTime = Date.now();
  }, timeout);
});

socket.on("waitingForPlayers", (users) => {
  console.log("Waiting for a player to join...");
});

socket.on("updateGame", (users, newGameRound, timeout, x, y) => {
  // Increase gameRound by 1
  gameRound = newGameRound;

  userOneTimeEl.innerText = `${users[0].speed}s`;
  userTwoTimeEl.innerText = `${users[1].speed}s`;

  scoreResultEl.innerHTML = `${users[1].score} - ${users[0].score}`;

  // Clear the board of virus
  gameBoardEl.innerHTML = "";

  // If 10 rounds have been played, emit gameOver to server
  if (gameRound === 10) {
    gameBoardEl.innerHTML = "";

    if (users[0].score > users[1].score) {
      alert(`${users[0].name} Won with ${users[0].score}!`);
    } else if (users[0].score == users[1].score) {
      alert("Draw! 5 - 5");
    } else {
      alert(`${users[1].name} Won with ${users[1].score}!`);
    }

    socket.emit("gameOver", socket.id);

    scoreResultEl.innerText = "0 - 0";
    userOneTimeEl.innerText = "00:00";
    userTwoTimeEl.innerText = "00:00";

    gameRound = 0;

    showLobby();

    return;
  }

  // Render new virus after timeout
  setTimeout(() => {
    gameBoardEl.innerHTML += `
            <div id="virus" style="position: absolute; top: ${y}px; left: ${x}px;">👾</div>
        `;
    stopCounter();
    resetCounter();
    startCounter();

    // Time of virus render
    createdTime = Date.now();
  }, timeout);
});

usernameFormEl.addEventListener("submit", (e) => {
  e.preventDefault();

  username = (
    usernameFormEl.querySelector("#username") as HTMLInputElement
  ).value.trim();

  socket.emit("getRoomList", (rooms) => {
    roomId = rooms[0].id;
  });

  if (!username) {
    return;
  }

  socket.emit("createUser", username, (result) => {
    if (!result.success || !result.data) {
      alert("No access.");
      return;
    }

    showLobby();
  });
});

roomsEl.addEventListener("click", (e) => {
  const target = e.target as HTMLButtonElement;

  if (target.tagName === "BUTTON") {
    roomId = target.value;
    console.log(
      `User ${username} with socket.id ${socket.id} wants to join room ${roomId}`
    );

    if (!username) {
      return;
    }

    socket.on("userNames", (users) => {
      users.forEach((user) => {
        userOneEl.innerText = users[0]?.name || "Empty";
        userTwoEl.innerText = users[1]?.name || "Empty";

        userOneNameEl.innerText = users[0]?.name || "Empty";
        userTwoNameEl.innerText = users[1]?.name || "Empty";
      });
    });

    const gameBoardSize = {
      x: gameBoardEl.offsetWidth,
      y: gameBoardEl.offsetHeight,
    };

    socket.emit("userJoin", gameBoardSize, username, roomId, (result) => {
      if (!result.success) {
        return alert(`Room with id ${roomId} is full.`);
      }

      showGameView();
    });
  }
});

gameBoardEl.addEventListener("click", (e) => {
  const target = e.target as HTMLDivElement;

  if (target.id === "virus") {
    const gameBoardSize = {
      x: gameBoardEl.offsetWidth,
      y: gameBoardEl.offsetHeight,
    };

    clickTime = Date.now();

    const reactionTime: number = (clickTime - createdTime) / 1000;

    stopCounter();

    socket.emit(
      "virusClicked",
      gameBoardSize,
      gameRound,
      reactionTime,
      socket.id
    );

    gameBoardEl.innerHTML = "";
  }
});
