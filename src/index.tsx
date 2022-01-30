import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import {ipcRenderer} from "electron";

import Main from "./components/Main"
import MainWeekView from "./components/MainWeekView"
import {IPlayer, PlayingState} from './logic/Player';
import PlayerList from './logic/PlayerList'
import {Week} from './logic/Week';
import reportWebVitals from './reportWebVitals';

declare global {
    interface Window {
        filesys? : any
    }
}


async function getJSON(filepath: string): Promise<IPlayer[] | null> {
    var jsonData: BufferSource | null = null;

    try {
        jsonData = await window.filesys.readFile(filepath)
    } 
    catch (e) {
        if (e instanceof TypeError) {
            console.log("Error fetching JSON file: " + filepath);
            console.log(e.message);
        } else {
            throw e
        }
    }

    if (jsonData != null) {
        var data: IPlayer[] = JSON.parse(new TextDecoder().decode(jsonData));
        return data
    } else {
        console.log("Error getting JSON")
    }

    return null
} 


const filepath = "/Users/ewan/git/umcss-league-manager/src/data/players.json"

getJSON(filepath)
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

    for (var player of players) {
        player.playingState = PlayingState.active;
    }
    players[9].playingState = PlayingState.inactive;
    
    week.generateInitialRound();
    week.generateInitialRound();
    console.log(week.rounds[0].getGames())
    

    ReactDOM.render(
        <React.StrictMode>
            <Main inweek={week}/>        
        </React.StrictMode>,
        document.getElementById('root')
      );
}





// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
