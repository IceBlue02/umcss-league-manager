import React from 'react';
import '../styles/RoundColumn.css';

import Game from "../logic/Game";
import {Round} from "../logic/Week";

import GameBox from "./GameBox";
import ByeBox from  "./ByeBox";

type RoundColumnProps = {
    round: Round;
    active?: number
    callbacks: {
        cardClick: Function;
        scoreChanged: Function;
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
        }        return (       
            <div className="roundcolumn">
                <div className="roundcolumn-title">Round {this.props.round.number}</div>
                {rows}
            </div>
        )   
    }
}

export default RoundColumn;
