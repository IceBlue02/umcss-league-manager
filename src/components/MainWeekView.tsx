import React from 'react';
import {Week} from "../logic/Week"
import RoundColumn from "./RoundColumn"
import '../styles/MainWeekView.css';
import { runInThisContext } from 'vm';

type MainWeekViewProps = {
    week: Week
    callbacks: {
        scoreChanged: Function
    }
}

type MainWeekViewState = {
    activeCard: [number, number] | null
}

class MainWeekView extends React.Component<MainWeekViewProps, MainWeekViewState> {
    constructor(props: MainWeekViewProps) {
        super(props);
        this.state = {
            activeCard: null
        }
        this.oncardclick = this.oncardclick.bind(this)
    }

    //oncardclick(round: number, game: number)

    renderRound(i: number) {
        if (this.state.activeCard !== null && this.state.activeCard[0] === i) {
            return (
                <RoundColumn round={this.props.week.rounds[i]} 
                    active={this.state.activeCard[1]}
                    callbacks={{
                        scoreChanged: this.props.callbacks.scoreChanged, 
                        cardClick: this.oncardclick
                    }} key={i}/>
            )
        } else {
            return (
                <RoundColumn round={this.props.week.rounds[i]} 
                callbacks={{
                    scoreChanged: this.props.callbacks.scoreChanged, 
                    cardClick: this.oncardclick
                }} key={i}/>
            )
        }
        
    }

    oncardclick(round: number, game: number) {
        console.log("Clicked: ", round, game);
        if (this.state.activeCard != null) {
            if (this.state.activeCard[0] === round && this.state.activeCard[1] === game) {
                this.setState({activeCard: null})
            } else {
                this.setState({activeCard: [round, game]})
            }
        } else {
            this.setState({activeCard: [round, game]})
        }
    }

    render() {
        var rows = [];
        for (var i = 0; i < this.props.week.rounds.length; i++) {
            rows.push(this.renderRound(i));
        }
        return (       
            <div className="mainweekview">
                {rows}
            </div>
        )   
    }
}

export default MainWeekView;