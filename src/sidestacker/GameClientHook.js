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

    // Work around create-react-app proxy not supporting websocket
    const wsUrl = process.env.NODE_ENV === 'development' ?
      `ws://localhost:5000/api/game/${gameId}` :
      `ws://${window.location.host}/api/game/${gameId}`

    ws.current = new WebSocket(wsUrl)
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