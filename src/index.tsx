import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';

import Main from "./components/Main"

import PlayerList from './logic/PlayerList'
import {Week} from './logic/Week';
import {getPlayerJSON} from './logic/FileHandler';
import {HashRouter as Router,} from "react-router-dom"

declare global {
    interface Window {
        filesys? : any
    }
}

const filepath = "/Users/ewan/git/umcss-league-manager/src/data/players.json"

getPlayerJSON(filepath)
.then(jsonData => {
    if (jsonData !== null) {
        return new PlayerList(jsonData)
    } else {
        throw new Error("Something went wrong when generating the player list");
    }})
.then(pl => renderMain(pl))


function renderMain(pl: PlayerList) {
    var week = new Week(pl);
    var players = pl.getPlayers();
    

    ReactDOM.render(
        <React.StrictMode>
            <Router>
                <Main inweek={week}/>        
            </Router>
        </React.StrictMode>,
        document.getElementById('root')
      );
}
