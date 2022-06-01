import {Fragment, useCallback, useEffect, useState} from "react";
import {useGameManager, useSidestackerInitializer} from "./sidestacker/GameManagerHook";
import {useGameClient} from "./sidestacker/GameClientHook";
import {useSidestacker} from "./sidestacker/SidestackerGameHook";
import {Link} from "react-router-dom";


/**
 * This component is the entry point of the game.
 * It gets the game id using the `useSidestackerInitializer' hook
 * Creates the websocket connection with `useGameClient' with the gameId
 * Creates a game manager which handles the logic and state not specific to the game
 * Creates a game instance using useSidestacker
 *
 * Displays the UI for the current game app state provided by the game manager.
 *
 */
export const Sidestacker = () => {
  const gameId = useSidestackerInitializer();
  const {lastMessage, sendMessage} = useGameClient(gameId);
  const {gameAppState, result, self, players, message} = useGameManager(gameId, lastMessage);
  const sidestacker = useSidestacker(7, self, players, lastMessage, sendMessage);
  const gameManagerProps = {
    gameAppState, result, self, message, gameId
  }

  useEffect(() => {
    console.log("Got lastMessage", JSON.stringify(lastMessage));
  }, [lastMessage])

  return <UIForGameState gameManagerProps={gameManagerProps} gameProps={sidestacker}/>

}


/**
 * Depending on the state of the game a different UI element is shown to the user.
 * If the game is initializing, waiting for id or connection, it shows a spinner.
 * If the game is ready for the opponent to connect, it shows a link the user can share.
 * If both players are connected, show the game board
 * If the results have been obtained, show the results screen and a button to play again.
 *
 * @param gameManagerProps State given by the useGameManager hook
 * @param gameProps State given by the useSidestacker hook
 */
const UIForGameState = ({gameManagerProps, gameProps}) => {
  switch (gameManagerProps.gameAppState) {
    case 'awaiting-id':
    case 'awaiting-connection':
      return <StyledBox>
        <span className="text-slate-700 text-3xl font-bold">Creating a new game!</span>
        <Spinner className="text-slate-700 mt-4"/>
      </StyledBox>
    case 'awaiting-player':
      return <ShareLinkBox/>
    case 'playing-game':
      return <Board {...gameProps}/>
    case 'game-results':
      return <Results result={gameManagerProps.result}/>
    default:
      return <StyledBox>Something went wrong :(</StyledBox>
  }
}

/**
 * Creates a board for the game and a zone to display messages.
 *
 * The state and game-logic is stored in the useSidestacker hook of which the state and action are passed as props.
 *
 * @param board An array of arrays which represents the board of the game.
 * @param placePiece A function that allows the player to place pieces, given row and side.
 * @param piece The piece that was assigned to this client
 * @param availableRows An array of booleans that represent if a row has available spaces.
 * @param gameState The current game state, (see useSidestacker)
 */
const Board = ({board, placePiece, piece, availableRows, gameState}) => {
  return <div className="flex flex-col">
    <BoardMessage gameState={gameState}/>
    <div
      className="board">
      {board.map((r, ri) => (
        <Fragment key={ri}>
          <BoardButton piece={piece}
                       placePiece={placePiece.bind(null, ri, 'L')}
                       enabled={gameState === 'awaiting-piece' && availableRows[ri]}/>
          {r.map((s, si) => {
            return <Piece square={s} key={(ri * r.length) + si}/>;
          })}
          <BoardButton piece={piece}
                       placePiece={placePiece.bind(null, ri, 'R')}
                       enabled={gameState === 'awaiting-piece' && availableRows[ri]}/>
        </Fragment>
      ))}
    </div>
  </div>
}

const BoardMessage = ({gameState}) => {
  const uiForState = {
    'awaiting-piece': <span>It's your turn!</span>,
    'awaiting-player': <span>It's your friends turn!</span>,
    'awaiting-server': <Spinner className='text-slate-50'/>
  }

  return <div
    className="bg-slate-500 text-xl font-bold text-slate-50 mb-2 rounded-3xl h-16 flex items-center justify-center">
    {
      uiForState[gameState]
    }
  </div>
}

const BoardButton = ({piece, placePiece, enabled}) => {
  const playerColorClass = piece === 'X' ? 'cross-token' : 'circle-token';

  return <button className={`board-control ${playerColorClass}`}
                 disabled={!enabled}
                 onClick={placePiece}/>
}

const Piece = ({square}) => {
  const classMap = {
    'X': 'cross-token',
    'C': 'circle-token'
  }

  return <div
    className={`${square ? classMap[square] : 'bg-amber-50'} board-piece`}>
  </div>
}

const Spinner = ({className}) => {
  return <svg className={`${className ?? ''} animate-spin h-10 w-10`}
              xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
}

const StyledBox = ({children}) => {
  return <div className="styled-box">
    {children}
  </div>
}

const Results = ({result}) => {
  const face = {
    'tie': 'https://avatars.dicebear.com/api/big-smile/2.svg?mouth=unimpressed',
    'lost': 'https://avatars.dicebear.com/api/big-smile/2.svg?mouth=openSad',
    'won': 'https://avatars.dicebear.com/api/big-smile/2.svg'
  }
  const message = {
    'tie': "That's a tie",
    'lost': 'You lost',
    'won': 'You won'
  }

  return <StyledBox>
    <img src={face[result]} alt="Player's avatar"
         className="w-24 h-24"
    />
    <span className="text-slate-700 text-3xl font-bold my-12">{message[result]}</span>
    <Link to="/new-game"
          onClick={() => window.location.href = '/new-game'}
          className="px-8 py-4 bg-blue-400 text-slate-50 font-bold text-2xl ml-auto mr-auto rounded-xl">
      Try again?
    </Link>
  </StyledBox>
}

const ShareLinkBox = () => {
  const [linkTarget, setLinkTarget] = useState();
  const [isCopied, setIsCopied] = useState(false);
  const copyToClipboard = useCallback(() => {
    if (!linkTarget) return;
    linkTarget.select();
    navigator.clipboard.writeText(linkTarget.value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  }, [linkTarget])

  return <StyledBox>
    <span className="text-slate-700 text-3xl font-bold text-center">
      Almost there, just share this link with a friend
    </span>
    <input className="text-white bg-slate-700 rounded-3xl py-2 mt-8 font-mono px-4 text-sm"
           onClick={copyToClipboard}
           ref={setLinkTarget}
           value={window.location.href}
           readOnly
    />
    <span className="ease-in ease-out text-slate-500 text-xs mt-2">{isCopied ? 'Copied!' : 'Click to copy!'}</span>
  </StyledBox>
}
