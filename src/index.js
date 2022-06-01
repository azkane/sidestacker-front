import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App, {Welcome} from './App';
import {Sidestacker} from './Sidestacker';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App/>}>
        <Route path="" element={<Welcome/>}/>
        <Route path="new-game" element={<Sidestacker />}/>
        <Route path="*" element={<Welcome/>}/>
      </Route>
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
