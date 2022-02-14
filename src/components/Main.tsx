import React from 'react';
import {useNavigate} from 'react-router-dom';
import MainWeekView from "./MainWeekView"
import MenuBar from "./MenuBar"
import {Week, Round} from "../logic/Week"
import PlayerSelect from "./PlayerSelect"
import EditPlayerBox from "./EditPlayerBox"

import {Player, PlayingState} from "../logic/Player"
import update from "immutability-helper"

import {
    HashRouter as Router,
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

    constructor(props: MainProps) {
        super(props)
        this.state = {
            week: this.props.inweek,
            editPlayer: null
        }

        this.changeScore = this.changeScore.bind(this);
        this.changePlayingState = this.changePlayingState.bind(this);
        this.generateRound = this.generateRound.bind(this);
        this.onWeekEnd = this.onWeekEnd.bind(this);
        this.restoreFromBackup = this.restoreFromBackup.bind(this);
        this.playerChanged = this.playerChanged.bind(this);
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
            }}}}}}))
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
            }}}}}}))
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
            }}}}}}))
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
        }}))
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
            }}))
        } else {
            this.setState(update(this.state, {
                week: {
                    players: {
                        players: {
                            $push: [pl]
                        }
                    }
            }}))
        }

    }

        }

    }

    onWeekEnd() {
        //TODO: Week ending logic
        this.state.week.calculateRankings(true);
        this.state.week.getJSON();
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