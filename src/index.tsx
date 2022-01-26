import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {ipcRenderer} from "electron";


import {RoundColumn} from './RoundPane';
import {Player, IPlayer, PlayerList} from './games/Player';
import Game from './games/Game';
import reportWebVitals from './reportWebVitals';
import { getJSDocOverrideTagNoCache } from 'typescript';

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

const games = [];
const games2 = [];


const filepath = "/Users/ewan/git/umcss-league-manager/src/data/players.json"
let playerList: PlayerList

getJSON(filepath)
.then(jsonData => {
    if (jsonData !== null) {
        return new PlayerList(jsonData)
    } else {
        throw new Error("Something went wrong when generating the player list");
    }})
.then(pl => renderMain(pl))



function renderMain(pl: PlayerList) {
    const players = pl.getPlayers();
    const game1 = new Game([players[0], players[1]], 1, 1, undefined, true)
    const game2 = new Game([players[2], players[3]], 1, 2, [1, 0], false)
    const game3 = new Game([players[3], players[7]], 1, 3, [0, 1])
    const game4 = new Game([players[5], players[4]], 1, 4)
    const games = [game1, game2, game3, game4];
    const games2 = [game1, game2, game3, game4];

    ReactDOM.render(
        <React.StrictMode>
            <div className="round">
              <RoundColumn games={games} round={1}></RoundColumn>
              <RoundColumn games={games2} round={2}></RoundColumn>
            </div> 
            
        </React.StrictMode>,
        document.getElementById('root')
      );
}





// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
