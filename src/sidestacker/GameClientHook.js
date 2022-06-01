import {useCallback, useEffect, useRef, useState} from "react";
import {flushSync} from "react-dom";

/**
 * Initiates and maintains the WebSocket connection to the server.
 * Connects when a gameId value is provided.
 * @param {string} gameId Required to initialize WebSocket connection.
 */
export const useGameClient = (gameId) => {
  const ws = useRef()
  const [lastError, setLastError] = useState();
  const [lastMessage, setLastMessage] = useState();

  useEffect(() => {
    if (!gameId || ws.current) return;
    ws.current = new WebSocket(`ws://localhost:5000/api/game/${gameId}`)
    ws.current.addEventListener('error', e => {
      console.log("WebSocket error", e)
      setLastError(e)
    });

    ws.current.addEventListener('message', m => {
      let data = JSON.parse(m.data);
      // If messages come in too quick consumers may miss them, so flush them synchronously
      flushSync(() => setLastMessage(data));
    });
  }, [gameId]);

  const sendMessage = useCallback((message) => {
    if (!ws.current) return;
    ws.current.send(JSON.stringify(message));
  }, []);

  return {lastError, lastMessage, sendMessage}
}