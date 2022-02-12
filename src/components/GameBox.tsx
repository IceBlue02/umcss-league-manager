import React from 'react';
import Game from "../logic/Game"
import "../styles/GameBox.css"


const AUTOFILL = true;

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
        
        this.setWinner();
        this.onClick = this.onClick.bind(this);
        this.onScoreChange = this.onScoreChange.bind(this);
        
    }

    /**
     * Sets the winner depending on the scores, for display requirements
     */
    setWinner() {
        if (this.props.game.scores[0] == null || this.props.game.scores[1] == null) {
            this.winner = 0;
        } else if (this.props.game.scores[0] > this.props.game.scores[1]) {
            this.winner = -1;
        } else {
            this.winner = 1;
        }
    }

    /**
     * Toggles the score input boxes when the box is clicked.
     * 
     * Makes the callback to cardClick to clear any currently selected game box (including
     * this card if it is already selected)
     */
    onClick(event: React.MouseEvent<HTMLInputElement>) {
        if ((event.target as HTMLBodyElement).className === "scoreinput") {
           event.stopPropagation(); // Prevent event if clicking on textbox
        } else {
            this.props.callbacks.cardClick(this.props.game.round-1, this.props.game.gameno-1)
        }
    }

    /**
     * Callback function changed input into score input boxes. 
     * 
     * Handles autofilling the other value and making the callback to change the state
     * with the new value.
     */
    onScoreChange(event: React.FormEvent<HTMLInputElement>) {
        const newValue = event.currentTarget.value === "" ? null : parseInt(event.currentTarget.value);
        const otherValue = newValue === 0 ? 1 : 0;

        
        if (event.currentTarget.name === "upper") {
            if (AUTOFILL && this.props.game.scores.includes(null)) {
                this.props.callbacks.scoreChanged(this.props.game.round-1, this.props.game.gameno-1, 
                    newValue, otherValue)
                this.props.callbacks.cardClick(this.props.game.round-1, this.props.game.gameno-1);

            } else {
                this.props.callbacks.scoreChanged(this.props.game.round-1, this.props.game.gameno-1, 
                    newValue, undefined)
            }

        } else {
            if (AUTOFILL && this.props.game.scores.includes(null)) {
                this.props.callbacks.scoreChanged(this.props.game.round-1, this.props.game.gameno-1, 
                    otherValue, newValue)
                this.props.callbacks.cardClick(this.props.game.round-1, this.props.game.gameno-1);

            } else {
                this.props.callbacks.scoreChanged(this.props.game.round-1, this.props.game.gameno-1, 
                    undefined, newValue)
            }
        }
    }

    /**
     * Callback function for input into the score input boxes. Prevents non numeric characters 
     * from being input.
     */
    onScoreKeyPress(event: React.KeyboardEvent<HTMLInputElement>) { 
        const re = /[0-9]+/g;
        if (!re.test(event.key)) {
            event.preventDefault();
        }
    }

    /**
     * Renders the names, scores and input text boxes. 
     * 
     * Dynamically changes the classes depending on the state and winner to show/hide
     * the scores/inputs and the names in bold
     */
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
            scoreclass = ["score hidden", "score hidden"];
            inputclass = ["scoreinput", "scoreinput"];
        }

        return (
            <div className="gridbox-right">
                <div className="gridbox-row">
                    <span className={nameclass[0]}>{this.props.game.players[0].name}</span>
                    <span className={scoreclass[0]}>{this.props.game.scores[0]}</span>
                    <input type="text" 
                    className={inputclass[0]}
                    name="upper"
                    value={this.props.game.scores[0] === null ? "" : this.props.game.scores[0]}
                    onKeyPress={this.onScoreKeyPress}
                    onChange={this.onScoreChange}/>
                </div>
                <div className="gridbox-row">
                    <span className={nameclass[1]}>{this.props.game.players[1].name}</span>
                    <span className={scoreclass[1]}>{this.props.game.scores[1]}</span>
                    <input type="text" 
                    className={inputclass[1]}
                    name="lower"
                    value={this.props.game.scores[1] === null ? "" : this.props.game.scores[1]}
                    onKeyPress={this.onScoreKeyPress}
                    onChange={this.onScoreChange}/>
                </div>
            </div>
        )
        
    }
    render () {
        this.setWinner();
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