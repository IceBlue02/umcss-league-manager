import React from 'react';
import './RoundPane.css';


class Game {
    names: [string, string];
    scores: [number|null, number|null]
    round: number;
    gameno: number;
    hasFinished: boolean

    constructor(names: [string, string], round: number, gameno: number) {
        this.names = names;
        this.scores = [null, null];
        this.round = round;
        this.gameno = gameno;
        this.hasFinished = false;
    }
}

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
        console.log("columns rendered");
        var rows = [];
        for (var i = 0; i < this.props.games.length; i) {
            rows.push(this.renderGame(i));
        }
        return (       
            <div className="RoundBox">{rows}</div>
        )
        
    }
}

type GameBoxProps = {
    game: Game
}

class GameBox extends React.Component<GameBoxProps> {
    render () {
        return (
            <div className="gridbox">
                <div className="gridbox-gameno">{this.props.game.round}<br/>.<br/>{this.props.game.gameno}</div>
                <div className="gridbox-right">
                    <div className="gridbox-row">
                        <span className="name">{this.props.game.names[0]}</span>
                        <span className="score">{this.props.game.scores[0] == null ? "" : this.props.game.scores[0]}</span>
                    </div>
                    <div className="gridbox-row">
                        <span className="name">{this.props.game.names[1]}</span>
                        <span className="score">{this.props.game.scores[1] == null ? "" : this.props.game.scores[1]}</span>
                    </div>
                </div>
                
            </div>
        )
    }
}

export {RoundColumn, Game};
