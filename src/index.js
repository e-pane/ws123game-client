import "./styles.css";

import {
    renderGameUI,
    renderStartButton,
    clearStartButton,
    clearPreGameUI,
    renderGameOver,
    renderLegacyStats,
} from "./renderGameUI.js";

function generateUUID() {
  // simple RFC4122 version 4 compliant UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// persistent identity (for stats)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = generateUUID();
  localStorage.setItem("userId", userId);
}

const ws = new WebSocket(import.meta.env.VITE_WS_URL);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      type: "init",
      userId,
    }),
  );
};

const clientHandlers = {
  ready_to_start: handleGameStart,
  number_played: handlePlayNumber,
  undo_played: handleUndoPlay,
  game_over: handleGameOver,
  legacy_stats: handleLegacyStatsOverlay,
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const handler = clientHandlers[message.type];
    if (handler) {
        handler(message);
    } else {
        console.warn("No client handler for message type:", message.type);
    }
}

function handleGameStart(message) {
    clearStartButton();
    clearPreGameUI()
    renderGameUI(message, ws);
}

function handlePlayNumber(message) {
    const { players: playersForClient, currentPhase, numbersAvailable } = message;
    renderGameUI({ players: playersForClient, currentPhase, numbersAvailable },ws);
}

function handleUndoPlay(message) {
    console.log("client side undo play handler reached");
    const { players: playersForClient, currentPhase, numbersAvailable } = message;

    renderGameUI({ players: playersForClient, currentPhase, numbersAvailable }, ws);
}

function handleGameOver(message) {
    // players: playersForClient,
    // winnerIndex: result.winnerIndex,
    const players = message.players;
    const winnerIndex = message.winnerIndex
    const winningPlayer = players[winnerIndex];
    const winningPlayerName = winningPlayer.playerName;
  
    renderGameOver(winningPlayerName, ws);
    renderStartButton(ws);
}

function handleLegacyStatsOverlay(message) {
    const { players, error } = message;
    if (error) return alert(error);
    
    renderLegacyStats(players);
}

renderStartButton(ws);
