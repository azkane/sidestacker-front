import './App.css';
import {Fragment} from 'react';
import {Link, Outlet} from 'react-router-dom';

/*
 This component holds the layout and an Outlet for rendering routes.
 */
function App() {
  const welcomeMessage = [
    'Fun for all family!',
    'Play with friends!',
    'Waste some time, you know you want to!',
    'The connect-four twist you\'ve been waiting for!',
    'Stack the sides, connect four and win!',
  ]
  const message = welcomeMessage[Math.floor(Math.random() * welcomeMessage.length)]

  return (
    <div className='h-full grid grid-cols-12'>
      <div className='row-span-full col-start-1 col-span-6 bg-red-400 flex items-start relative overflow-hidden -z-10'>
        <div className="clip-cross mt-16 ml-16"/>
      </div>
      <div className='row-span-full col-start-7 col-span-6 bg-blue-300 -z-10'>
        <div className='doughnut min-h-full min-w-full'/>
      </div>
      <div
        className="row-span-full col-start-1 col-span-12 md:col-start-2 md:col-span-10 xl:col-start-4 xl:col-span-6 z-10 flex flex-col justify-center">
        <div className="bg-zinc-700 rounded-3xl p-8">
          <div className="text-slate-50 flex justify-center flex-col self-center mb-8">
            <h1 className="font-extrabold text-7xl antialiased lg:text-8xl">Sidestacker!</h1>
            <h5 className="text-sm font-bold italic ml-8 mt-2">{message}</h5>
          </div>
          <Outlet/>
        </div>
      </div>
    </div>
  );
}

/*
 Just a silly welcome page. Clicking on 'Play Now' starts a new game redirecting the player to the main app.
 */
export const Welcome = () => {
  return <Fragment>
    <Instructions/>
    <div className='text-center my-12'>
      <Link to="/new-game"
            className="px-8 py-4 bg-blue-400 text-slate-50 font-bold text-2xl ml-auto mr-auto rounded-xl">Play
        now!</Link>
    </div>
  </Fragment>
}


const RedSection = ({children, className}) => {
  return <div className={`bg-red-400 rounded-3xl ${className}`}>
    {children}
  </div>
}

const Instruction = ({id, avatarUrlRight, avatarUrlLeft, instruction, instructionSub}) => {
  return <div className="flex items-center text-slate-50 font-bold">
    {avatarUrlLeft ? <img src={avatarUrlLeft} className="w-24 h-24 mr-4" alt="Player 1 Avatar"/> : null}
    <span className='bg-zinc-700 text-slate-50 font-bold rounded-full h-10 w-10 text-center leading-10 mr-4'>{id}</span>
    <div>
      <p className='font-bold text-xl mr-4'>{instruction}</p>
      <p className='font-bold text mr-4'>{instructionSub}</p>
    </div>
    {avatarUrlRight ?
      <img src={avatarUrlRight} className="w-24 h-24 self-end ml-auto mr-0" alt="Player 2 Avatar"/> : null}
  </div>

}

const Instructions = () => {
  const instructions = [{
    id: 1
    , instruction: 'Start a new game, get a link and share with a friend.'
    , instructionSub: 'Ctrl-C Ctrl-V!'
    , avatarUrlLeft: 'https://avatars.dicebear.com/api/big-smile/2.svg?mouth=unimpressed'
  },
    {
      id: 2,
      instruction: 'Your friend joins and each get a piece.'
      , instructionSub: 'Good ol\' cross or circle!'
      , avatarUrlLeft: 'https://avatars.dicebear.com/api/big-smile/2.svg?mouth=kawaii'
      , avatarUrlRight: 'https://avatars.dicebear.com/api/big-smile/12.svg?flip=true&mouth=unimpressed'
    },
    {
      id: 3,
      instruction: 'Each player takes a turn to stack pieces on any side.'
      , instructionSub: 'In real time!'
      , avatarUrlLeft: 'https://avatars.dicebear.com/api/big-smile/2.svg'
      , avatarUrlRight: 'https://avatars.dicebear.com/api/big-smile/12.svg?flip=true&mouth=kawaii&eyes=normal'
    },
    {
      id: 4
      , instruction: 'The first to have four consecutive pieces horizontally, vertically or diagonally wins!'
      , instructionSub: 'Think your moves!'
      , avatarUrlLeft: 'https://avatars.dicebear.com/api/big-smile/2.svg?mouth=unimpressed&eyes=angry'
      , avatarUrlRight: 'https://avatars.dicebear.com/api/big-smile/12.svg?flip=true&mouth=openedSmile&eyes=normal'
    }
  ];

  return <Fragment>
    <p className='text-slate-50 text-2xl font-bold mb-8'>Playing with friends is easy:</p>
    <RedSection>
      {instructions.map(i => (
        <Instruction {...i} key={i.id}/>
      ))}
    </RedSection>
  </Fragment>
}

export default App;
