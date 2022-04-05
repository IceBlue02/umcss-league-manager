/* eslint-disable no-useless-computed-key */
import React from 'react';
import MainWeekView from "./MainWeekView"
import MenuBar from "./MenuBar"
import {Week} from "../logic/Week"
import PlayerSelect from "./PlayerSelect"
import {getBackupJSON} from "../logic/FileHandler"
import EditPlayerBox from "./EditPlayerBox"

import {Player, PlayingState} from "../logic/Player"
import update from "immutability-helper"

import {
    Route, 
    Routes
} from "react-router-dom"


type MainProps = {
    inweek: Week
}
type MainState = {
    week: Week
    editPlayer: number | null
}

class Main extends React.Component<MainProps, MainState> {
    state: MainState;
    sinceBackup: Date;

    constructor(props: MainProps) {
        super(props)
        this.state = {
            week: this.props.inweek,
            editPlayer: null
        }
        this.sinceBackup = new Date();

        this.changeScore = this.changeScore.bind(this);
        this.changePlayingState = this.changePlayingState.bind(this);
        this.generateRound = this.generateRound.bind(this);
        this.onWeekEnd = this.onWeekEnd.bind(this);
        this.restoreFromBackup = this.restoreFromBackup.bind(this);
        this.playerChanged = this.playerChanged.bind(this);
    }

    restoreFromBackup() {
        getBackupJSON()
        .then(jsonData => {
            if (jsonData !== null) {
                return Week.fromBackup(jsonData)
            } else {
                throw new Error("Something went wrong when generating the player list");
            }})
        .then(pl => this.setState(update(this.state, {week: {$set: pl}})))
    }

    changePlayingState(playerID: number, state: PlayingState, newIndx: number) {
        const indx = this.state.week.players.getIndexFromID(playerID)
        this.setState(update(this.state, {
            week: {
                players: {
                    players: {
                        [indx]: {
                            playingState: {$set: state}
                        }
                    }
                }
            }
        }))
        window.filesys.savePlayerFile(this.state.week.players.getJSON())
        this.backup()
    }

    changeScore(roundno: number, gameno: number, upperScore?: number, lowerScore?: number) {

        if (upperScore !== undefined && lowerScore !== undefined) {
            this.setState(update(this.state, {
                week: {
                    rounds: {
                        [roundno]: {
                            games: {
                                [gameno]: {
                                    scores: {
                                        [0]: {$set: upperScore},
                                        [1]: {$set: lowerScore}},
            }}}}}}), () => {this.backup()})
        } 
        else if (upperScore !== undefined) {
            this.setState(update(this.state, {
                week: {
                    rounds: {
                        [roundno]: {
                            games: {
                                [gameno]: {
                                    scores: {
                                        [0]: {$set: upperScore}},
            }}}}}}), () => {this.backup()})
        } 
        else if (lowerScore !== undefined) {
            this.setState(update(this.state, {
                week: {
                    rounds: {
                        [roundno]: {
                            games: {
                                [gameno]: {
                                    scores: {
                                        [1]: {$set: lowerScore}},
            }}}}}}), () => {this.backup()})
        }
    }

    generateRound() {
        var round;
        if (this.state.week.nextround === 1) {
            round = this.state.week.generateInitialRound()
        } else {
            round = this.state.week.generateNextRound()
        }
        
        this.setState(update(this.state, {
            week: {
                rounds: {$push: [round]}
        }}), () => {this.backup()})
    }

    playerChanged(pl: Player) {
        if (this.state.week.players.isIDAssigned(pl.id)) {
            const plstate = this.state.week.players.getPlayerFromID(pl.id).playingState
            pl.playingState = plstate;
            var indx = this.state.week.players.getIndexFromID(pl.id)
            this.setState(update(this.state, {
                week: {
                    players: {
                        players: {
                            [indx]: {$set: pl}
                        }
                    }
            }}), () => {this.backup()})
        } else {
            this.setState(update(this.state, {
                week: {
                    players: {
                        players: {
                            $push: [pl]
                        }
                    }
            }}), () => {this.backup()})
        }
    }

    backup() {
        const jsondata = this.state.week.toJSONBackup();
        window.filesys.saveBackup(jsondata, "backup.json");

        const currenttime = new Date();
        const minssince = Math.abs((currenttime.getTime() - this.sinceBackup.getTime()) / 60000)

        console.log("mins", minssince)
        if (minssince > 2) {
            console.log("backup" + currenttime.toISOString().replace(".", "").replace(":", "") + ".json");
            window.filesys.saveBackup(jsondata, "backup" + currenttime.toISOString().replace(".", "").replace(":", "") + ".json");
            this.sinceBackup = currenttime;
        }

    }

    onWeekEnd() {
        this.backup()
        const scorelog = this.state.week.calculateRankings(true);
        window.filesys.saveScoringLog(scorelog);

        const csvdata = this.state.week.getCSVRankings();
        window.filesys.saveCSVFile(csvdata);
    }

    
    render() {
        return (
            <div className="main">
                <Routes>
                    <Route path="/" element={
                        <div className="wrapper">
                            <MenuBar callbacks= {{generateRound: this.generateRound, weekEnd: this.onWeekEnd, backupLoad: this.restoreFromBackup}} />
                            <MainWeekView week={this.state.week} callbacks={{scoreChanged: this.changeScore}}/>
                        </div>
                    }/>
                    <Route path="/players" element={<PlayerSelect players={this.state.week.players} callbacks={{playerStateChanged: this.changePlayingState}}/>}/>
                    <Route path="/editplayer" element={<EditPlayerBox callbacks={{setPlayer: this.playerChanged}}/>}/>
                </Routes>
            </div>
        )
    }
}

export default Main