import {useCallback, useEffect, useReducer} from "react";

/*
 Manages a single sidestacker game.

 The rules of the game are handled in the backend, we mostly only need to handle
 some rules for piece placement and turn tracking. Every move is sent to the backend
 for confirmation.

 The game can be in one of the following states:
 - awaiting-piece:
 The game is waiting for the player to place a piece.
 - awaiting-server:
 The game is waiting for the server to confirm a piece placement.
 - awaiting-player:
 The game is waiting for the opponent to place a piece.

 The required parameters are:
 boardSize: Board size, defaults to 7
 self: Object with piece and turn for this player
 players: Array of currently connected players
 lastServerMessage: The object the server sent last

 This hook returns an object with the following definition:
 gameState: Current game state (see above)
 board: An array of arrays which represents the board
 placePiece: A function which allows the client to place pieces given row and side
 availableRows: An array of booleans which represent if a row has free spaces
 piece: The piece (X or C) that this client was assigned.
 */
export const useSidestacker = (boardSize, self, players, lastServerMessage, sendMessage) => {
  const [state, dispatch] = useReducer(sidestackerGameReducer, {
    gameState: undefined,
    turn: 0,
    currentPiece: undefined,
    board: [...Array(boardSize)]
      .map(_ => Array(boardSize).fill(undefined).map(_ => undefined)),
    availableRows: [...Array(boardSize).fill(true)],
    self: undefined,
    players: undefined,
    lastMove: undefined,
    lastBoard: undefined
  });

  useEffect(() => {
    if (!state.self && self) {
      dispatch({type: 'set-self', payload: self})
    }
  }, [self, state.self]);

  useEffect(() => {
    if (!players) return;
    dispatch({type: 'set-players', payload: players})
  }, [players])

  useEffect(() => {
    if (!lastServerMessage) return;
    dispatch({type: 'server-message', payload: lastServerMessage});
  }, [lastServerMessage])

  useEffect(() => {
    if (state.gameState !== 'awaiting-server') return;
    sendMessage({
                  type: 'piece-placement',
                  row: state.lastMove.row,
                  side: state.lastMove.side
                })
  }, [state.lastMove, state.gameState, sendMessage])

  const placePiece = useCallback((row, side) => {
                                   dispatch({'type': 'place-piece', payload: {row, side}})
                                 },
                                 []);

  return {
    gameState: state.gameState,
    board: state.board,
    placePiece,
    availableRows: state.availableRows,
    piece: state.self ? state.self.piece : 'C'
  }
}

const handleSetPlayers = (players, state) => {
  const readyToStart = players.length >= 2;
  const firstPiece = readyToStart && players.find(p => p.turn === 0).piece;
  const isSelfFirst = readyToStart && firstPiece === state.self.piece;
  return {
    ...state,
    players,
    currentPiece: readyToStart ? firstPiece : undefined,
    gameState: isSelfFirst ? 'awaiting-piece' : 'awaiting-player',
  }
};

const handlePlacePiece = (piecePlacement, state) => {
  const {row, side} = piecePlacement;
  const {board, currentPiece} = state;
  const newBoard = placePiece(board, currentPiece, row, side);
  const availability = getRowAvailabilityFromBoard(newBoard);
  return {
    ...state,
    board: newBoard,
    availableRows: availability,
    gameState: 'awaiting-server',
    lastMove: piecePlacement,
    lastBoard: board
  }
};

const handlePiecePlacedAwaitingServer = (message, state) => {
  if (message.player === state.currentPiece &&
      message.turn === state.turn &&
      message.row === state.lastMove.row &&
      message.side === state.lastMove.side) {
    return {
      ...state,
      gameState: "awaiting-player",
      turn: state.turn + 1,
      currentPiece: message.player === 'X' ? 'C' : 'X'
    }
  } else {
    console.log('Received piece_placed but didn\'t match expected response',
                'state:', state,
                'message:', message);
    return state;
  }
};

const handlePiecePlacedAwaitingPlayer = (message, state) => {
  if (message.player === state.currentPiece &&
      message.turn === state.turn) {
    const {row, side} = message;
    const {board, currentPiece} = state;
    const newBoard = placePiece(board, currentPiece, row, side);
    const availability = getRowAvailabilityFromBoard(newBoard);
    return {
      ...state,
      board: newBoard,
      availableRows: availability,
      gameState: 'awaiting-piece',
      lastMove: {row, side},
      turn: state.turn + 1,
      currentPiece: message.player === 'X' ? 'C' : 'X'
    }
  } else {
    console.log("Received piece_placed but didn't match expected response",
                'state:', state,
                'message:', message);
    return state;
  }
};

const handlePiecePlacedError = (state, message) => {
  if (state.gameState === 'awaiting-server') {
    if (message.player === state.currentPiece &&
        message.turn === state.turn) {
      return {
        ...state,
        gameState: 'awaiting-piece',
        board: state.lastBoard
      }
    } else {
      console.log("Received piece_placed_error but didn't match expected response",
                  'state', state,
                  'message', message);
      return state;
    }
  } else {
    console.log("Received piece_placed_error but wasn't awaiting for confirmation",
                'state', state,
                'message', message);
    return state
  }
};

const handleServerMessage = (state, message) => {
  switch (message.type) {
    case 'piece_placed': {
      if (state.gameState === "awaiting-server") {
        return handlePiecePlacedAwaitingServer(message, state);
      } else if (state.gameState === 'awaiting-player') {
        return handlePiecePlacedAwaitingPlayer(message, state);
      } else {
        console.log("Received piece_placed but wasn't awaiting for player or confirmation",
                    'state', state,
                    'message', message);
        return state;
      }
    }
    case 'piece_placed_error': {
      return handlePiecePlacedError(state, message);
    }
    default:
      return state;
  }
}

const sidestackerGameReducer = (state, action) => {
  switch (action.type) {
    case 'set-self':
      return {
        ...state,
        self: action.payload,
      }
    case 'set-players':
      const players = action.payload;
      return handleSetPlayers(players, state);
    case 'place-piece': {
      const piecePlacement = action.payload;
      return handlePlacePiece(piecePlacement, state);
    }
    case 'server-message': {
      const message = action.payload;
      return handleServerMessage(state, message);
    }
    default: {
      console.log("sidestackerGameReducer: unhandled case", action)
      return state;
    }
  }
}

/**
 * Creates a new board with the specified piece in the given row and side.
 * @param {number[][]} board
 * @param {'C' | 'X'} piece
 * @param {number} row
 * @param {'L' | 'R'} side
 * @return {number[][]} new board
 */
export const placePiece = (board, piece, row, side) => {
  let boardRow = [...board[row]];
  let [iter, iterCondition, iterModifier] = side === 'L' ?
    [0, i => i < boardRow.length, _ => iter++] :
    [boardRow.length - 1, i => i >= 0, _ => iter--];
  for (iter; iterCondition(iter); iterModifier()) {
    if (!boardRow[iter]) {
      boardRow[iter] = piece;
      break;
    }
  }

  return [
    ...board.slice(0, row),
    boardRow,
    ...board.slice(row + 1)
  ]
}

/**
 * Creates an array indicating which row have available spaces for pieces.
 * @param {number[][]} board
 */
export const getRowAvailabilityFromBoard = (board) => {
  let rowToAvailability = [];
  for (let i = 0; i < board.length; i++) {
    let row = board[i];
    rowToAvailability.push(row.indexOf(undefined) > -1);
  }
  return rowToAvailability;
}