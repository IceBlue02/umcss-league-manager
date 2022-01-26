import React from 'react';
import './RoundPane.css';
import Game from "./games/Game";
import {Player} from "./games/Player"

type RoundColumnProps = {
    games: Game[],
    round: number
}

class RoundColumn extends React.Component<RoundColumnProps> {
    // constructor (props: RoundBoxProps) {
    //     super(props);
    // }
    renderGame(i: number) {
        return (
            <GameBox game={this.props.games[i]} key={i}/>
        )
    }

    render() {
        var rows = [];
        for (var i = 0; i < this.props.games.length; i++) {
            rows.push(this.renderGame(i));
        }
        console.log(rows);
        return (       
            <div className="roundcolumn">
                <div className="roundcolumn-title">Round {this.props.round}</div>
                {rows}
            </div>
        )   
    }
}

type GameBoxProps = {
    game: Game
}

class GameBox extends React.Component<GameBoxProps> {

    renderGridboxRight() {
        if (this.props.game.scores[0] == null || this.props.game.scores[1] == null) {
            return (
                <div className="gridbox-right">
                    <div className="gridbox-row">
                        <span className="name">{this.props.game.players[0].name}</span>
                    </div>
                    <div className="gridbox-row">
                        <span className="name">{this.props.game.players[1].name}</span>
                    </div>
                </div>
            )
        }

        if (this.props.game.scores[0] > this.props.game.scores[1]) {
            return (
                <div className="gridbox-right">
                    <div className="gridbox-row">
                        <span className="name winner">{this.props.game.players[0].name}</span>
                        <span className="score winner">{this.props.game.scores[0]}</span>
                    </div>
                    <div className="gridbox-row">
                        <span className="name">{this.props.game.players[1].name}</span>
                        <span className="score">{this.props.game.scores[1]}</span>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="gridbox-right">
                    <div className="gridbox-row">
                        <span className="name">{this.props.game.players[0].name}</span>
                        <span className="score">{this.props.game.scores[0]}</span>
                    </div>
                    <div className="gridbox-row">
                        <span className="name winner">{this.props.game.players[1].name}</span>
                        <span className="score winner">{this.props.game.scores[1]}</span>
                    </div>
                </div>
            )
        }
    }
    render () {
        return (
            <div className={"gridbox" + (this.props.game.isPlaying ? " playing" : "")}>
                <div className="gridbox-left">
                    <div className="gridbox-gameno">{this.props.game.round}<br/>·<br/>{this.props.game.gameno}</div>
                </div>
                {this.renderGridboxRight()}
            </div>
        )
    }
}

export {RoundColumn, Game};
