import {useSearchParams} from "react-router-dom";
import {useEffect, useReducer, useState} from "react";

/*
 * This hook maintains the current game application state.
 *
 * Game application state:
 * The game application can be on one of several states at any given time.
 * Each state maps roughly to a UI component that should be displayed for each state.
 * These can be:
 * - awaiting-id:
 * The gameId is a parameter of the hook, it can be obtained from the endpoint or the querystring.
 * Once this value is not undefined, transitition to 'awaiting-connection'
 * - awaiting-connection:
 * This state means that the game has an id, the client is waiting for a 'connection' message
 * This message specifies the pieces and the turn order of the player.
 * Once this message is received, transition to 'awaiting-player'
 * - awaiting-player:
 * The game is waiting for the other player. This is signaled with a 'player_info' message
 * which has a list of players. If this list is >= 2 it means the player has connected.
 * Once the other player is connected, transition to 'playing-game'.
 * - playing-game
 * The game is being played.
 * Once a 'game_over' message is received, transition to 'game-results'.
 * - game-results:
 * The game is over.
 * - error:
 * An error ocurred in some state.
 */
export const useGameManager = (gameId, lastMessage) => {
  const [state, dispatch] = useReducer(gameStateReducer,
                                       {
                                         gameId: undefined,
                                         gameAppState: 'awaiting-id',
                                         self: undefined,
                                         playerInfo: undefined,
                                         message: '',
                                         result: undefined
                                       });
  useEffect(() => {
    if (lastMessage && lastMessage.type) {
      dispatch(lastMessage);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (gameId) {
      dispatch({type: 'set-gameId', payload: gameId})
    }
  }, [gameId]);

  return {
    gameAppState: state.gameAppState,
    self: state.self,
    players: state.playerInfo,
    result: state.result,
    message: state.message,
  }
}

const gameStateReducer = (state, action) => {
  if (!action.type) return state;
  switch (action.type) {
    case 'set-gameId':
      return {
        ...state,
        gameId: action.payload,
        gameAppState: 'awaiting-connection'
      }
    case 'connection': {
      return {
        ...state,
        self: {piece: action.player, turn: action.turn}
      }
    }
    case 'player_info': {
      return {
        ...state,
        playerInfo: action.players,
        gameAppState: action.players.length >= 2 ? 'playing-game' : 'awaiting-player'
      }
    }
    case 'disconnection':
      return {
        ...state,
        message: `Player with the ${action.player} pieces disconnected :(`
      }
    case 'game_over':
      const winner = action.winner
      let result;
      if (!winner) result = 'tie'
      else if (winner === state.self.piece) result = 'won'
      else result = 'lost';

      return {
        ...state,
        result,
        gameAppState: 'game-results'
      }
    case 'piece_placed':
    case 'piece_placed_error':
      // Ignore game states
      return state
    default:
      console.log('gameStateReducer: Unhandled message type', action);
      return state;
  }
}

/*
 Initializes a game with the server.
 Checks if the user is connecting to an existing game by trying to get the gameId param.
 If there's no gameId param calls the new-game endpoint to obtain an ID and sets the param.

 returns the gameId
 */
export const useSidestackerInitializer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gameId, setGameId] = useState(searchParams.get('gameId'));
  const [isFetchingId, setFetchingId] = useState(false);

  useEffect(() => {
    const fetchNewGameId = async () => {
      if (!gameId && !isFetchingId) {
        setFetchingId(true);
        let {game_id} = await newGame()
        setGameId(game_id)
        setSearchParams({gameId: game_id})
        setFetchingId(false)
      }
    }
    fetchNewGameId();
  }, [gameId, isFetchingId, setSearchParams])

  return gameId;
}

const newGame = async () => {
  let response = await fetch('/api/new-game', {method: 'POST'});
  response = await response.json()
  return response;
}