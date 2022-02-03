import React from 'react';
import Game from "../logic/Game"
import "../styles/GameBox.css"

type GameBoxProps = {
    game: Game;
    active: boolean
    callbacks: {
        scoreChanged: Function;
        cardClick: Function;
    }
}

class GameBox extends React.Component<GameBoxProps> {
    winner: number = 0;
    constructor (props: GameBoxProps) {
        super(props);
        if (this.props.game.scores[0] == null || this.props.game.scores[1] == null) {
            this.winner = 0;
        } else if (this.props.game.scores[0] > this.props.game.scores[1]) {
            this.winner = -1;
        } else {
            this.winner = 1;
        }

        this.onClick = this.onClick.bind(this);
        
    }

    onClick(event: React.MouseEvent<HTMLInputElement>) {
        if ((event.target as HTMLBodyElement).className === "scoreinput") {
           event.stopPropagation(); 
        } else {
            this.props.callbacks.cardClick(this.props.game.round-1, this.props.game.gameno-1)
        }
    }

    onScoreChange(event: React.FormEvent<HTMLInputElement>) {
        this.props.callbacks.scoreChanged(this.props.game.round-1, this.props.game.gameno-1, 
            )
    }

    renderGridboxRight() {
        var nameclass:[string, string] = ["name", "name"];
        var scoreclass:[string, string] = ["score hidden", "score hidden"];
        var inputclass:[string, string] = ["scoreinput hidden", "scoreinput hidden"];

        if (this.winner === -1) {
            nameclass = ["name winner", "name"]
            scoreclass = ["score winner", "score"]
        } else if (this.winner === 1) {
            nameclass = ["name", "name winner"]
            scoreclass = ["score", "score winner"]
        }

        if(this.props.active) {
            nameclass = ["name winner", "name winner"]
            inputclass = ["scoreinput", "scoreinput"];
        }

        return (
            <div className="gridbox-right">
                <div className="gridbox-row">
                    <span className={nameclass[0]}>{this.props.game.players[0].name}</span>
                    <span className={scoreclass[0]}>{this.props.game.scores[0]}</span>
                    <input type="text" 
                    className={inputclass[0]}
                    name="0"
                    value={this.props.game.scores[0] === null ? "" : this.props.game.scores[0]}
                    onChange={this.onScoreChange}/>
            
                </div>
                <div className="gridbox-row">
                    <span className={nameclass[1]}>{this.props.game.players[1].name}</span>
                    <span className={scoreclass[1]}>{this.props.game.scores[1]}</span>
                </div>
            </div>
        )
        
    }
    render () {
        return (
            <div className={"gridbox" + (this.props.game.isPlaying ? " playing" : "")} onClick={this.onClick}>
                <div className="gridbox-left">
                    <div className="gridbox-gameno">{this.props.game.round}<br/>·<br/>{this.props.game.gameno}</div>
                </div>
                {this.renderGridboxRight()}
            </div>
        )
    }
}

export default GameBox