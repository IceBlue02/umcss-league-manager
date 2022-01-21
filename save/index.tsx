import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {RoundColumn, Game} from './RoundPane';
import reportWebVitals from './reportWebVitals';


const game1 = new Game(["Ashley Smith", "Will Rodliffe"], 1, 1);
const game2 = new Game(["Jacob Newby", "Taylor Martin"], 1, 2);
const game3 = new Game(["Aiden Mooney", "Fursey Butler"], 1, 3);

const games = [game1, game2, game3];

ReactDOM.render(
  <React.StrictMode>
      <p>Something worked, at least</p>
    <RoundColumn games={games} round={1}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
