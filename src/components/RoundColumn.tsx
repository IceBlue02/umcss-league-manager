import React from 'react';
import '../styles/RoundColumn.css';

import Game from "../logic/Game";
import {Player, PlayingState} from "../logic/Player";
import PlayerList from "../logic/PlayerList"
import {Round} from "../logic/Week";

import GameBox from "./GameBox";
import ByeBox from  "./ByeBox";

import update from "immutability-helper"

type RoundColumnProps = {
    round: Round;
    active?: number
    players: PlayerList
    callbacks: {
        cardClick: Function;
        scoreChanged: Function;
        addGame: Function;
    }
}

class RoundColumn extends React.Component<RoundColumnProps> {
    games: Game[];

    constructor (props: RoundColumnProps) {
         super(props);
         this.games = this.props.round.getGames();
    }

    renderGame(i: number) {
        if (this.props.active !== undefined && this.props.active === i) {
            return (
                <GameBox game={this.games[i]} active={true}
                callbacks={this.props.callbacks} key={i}/>
            )
        } else {
            return (
                <GameBox game={this.games[i]} active={false}  
                callbacks={this.props.callbacks} key={i}/>
            )
        }
    }

    renderBye() {
        if (this.props.round.bye !== null) {
            return <ByeBox player={this.props.round.bye}/>
        }
    }

    render() {
        this.games = this.props.round.getGames();
        var rows = [];
        if (this.props.round.bye != null) {
            rows.push(this.renderBye());
        }
        for (var i = 0; i < this.games.length; i++) {
            rows.push(this.renderGame(i));
        } 
        return (       
            <div className="roundcolumn">
                <div className="roundcolumn-title">Round {this.props.round.number}</div>
                {rows}
                <GameAddBox callbacks={{addGame: this.props.callbacks.addGame}} roundno={this.props.round.number}
                 players={this.props.players}></GameAddBox>
            </div>
        )   
    }
}

export default RoundColumn;

type GameAddBoxProps = {
    callbacks: {
        addGame: Function;
    }
    roundno: number;
    players: PlayerList;
}

type GameAddBoxState = {
    active: boolean
    player1: Player | null,
    player2: Player | null
}


class GameAddBox extends React.Component<GameAddBoxProps, GameAddBoxState> {

    constructor (props: GameAddBoxProps) {
        super(props);
        this.state = {
            active: false,
            player1: null,
            player2: null
        }
        this.onShowGameAdd = this.onShowGameAdd.bind(this);
        this.onNewGame = this.onNewGame.bind(this);
    }

    onShowGameAdd() {
        if (this.state.active) {
            this.setState({active: false});
        } else {
            this.setState({active: true});
        }
    }

    handlePlayerChange(plid: number, playno: number) {
        console.log(plid);
        var pl;

        if (plid === 0) {
            pl = null;
        } else {
            pl = this.props.players.getPlayerFromID(plid)
        }

        if (playno === 1) {
            this.setState(update(this.state,
                {player1: {$set: pl}}
            ))
        } else {
            this.setState(update(this.state,
                {player2: {$set: pl}}
            ))
        }

    }

    buildPlayerForm() {
        let items = [];  
        var i = 1;
        let p1 = this.props.players.getPlayersWithState(PlayingState.PLAYING)[0];
        // if (this.state.player1 !== p1) {
        //     this.setState(update(this.state,
        //         {player1: {$set: p1},
        //          player2: {$set: p1}}
        //     ))
        // }

        items.push(<option key={0} value={0}>{ }</option>)
        items.push(<optgroup key="optplaying" label="Active"/>)       
        for (const pl of this.props.players.getPlayersWithState(PlayingState.PLAYING)) {             
            items.push(<option key={i} value={pl.id}>{pl.name}</option>);   
            i++;
        }
        items.push(<optgroup key="optaway" label="Away"/>) 
        for (const pl of this.props.players.getPlayersWithState(PlayingState.AWAY)) {             
            items.push(<option key={i} value={pl.id}>{pl.name}</option>);   
            i++;
        }
        items.push(<optgroup key="optinactive" label="Inactive"/>) 
        for (const pl of this.props.players.getPlayersWithState(PlayingState.NOTPLAYING)) {             
            items.push(<option key={i} value={pl.id}>{pl.name}</option>);   
            i++;
        }
        return items;
    }

    onNewGame() {
        if (this.state.player1 === null || this.state.player2 === null) {
            return
        }
        //var pl1 = this.props.players.getPlayerFromName('hello');
        console.log(this.state.player1)
        this.props.callbacks.addGame(this.props.roundno, this.state.player1, this.state.player2);
        
        //this.props.callbacks.addGame(this.props.roundno);
        this.setState({active: false})
    }

    render() {
        const disableAddGame =  this.state.player1 === null || this.state.player2 === null || 
                                this.state.player1.id === this.state.player2.id;
        return (       
            <div className="game-add-box">
                <div className="game-add-box-top">
                    <button className="game-add-show-btn" onClick={this.onShowGameAdd}>
                        Add Game
                    </button>
                </div>
                {this.state.active && 
                    <form className="add-player-form">
                        <div className="add-player-form-left">
                            <select name="player1" className="add-player-select" id="add-player-1" onChange={(e) => this.handlePlayerChange(Number(e.target.value), 1)}>
                                {this.buildPlayerForm()}
                            </select>
                            <select name="player2" className="add-player-select" id="add-player-2" onChange={(e) => this.handlePlayerChange(Number(e.target.value), 2)}>
                                {this.buildPlayerForm()}
                            </select>
                        </div>
                        <div className="add-player-form-right">
                            <button type="button" className="add-game-btn" disabled={disableAddGame} onClick={this.onNewGame}>+</button>
                        </div>
                    </form>
                }
            </div>
        )   
    }
}

