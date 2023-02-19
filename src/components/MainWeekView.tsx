import React from 'react';
import { Week } from '../logic/Week';
import RoundColumn from './RoundColumn';
import PlayerList from '../logic/PlayerList';
import '../styles/MainWeekView.css';

type MainWeekViewProps = {
    week: Week
    callbacks: {
        scoreChanged: Function
        addGame: Function
    }
    players: PlayerList;
};

type MainWeekViewState = {
    activeCard: [number, number] | null
};

class MainWeekView extends React.Component<MainWeekViewProps, MainWeekViewState> {
    constructor(props: MainWeekViewProps) {
        super(props);
        this.state = {
            activeCard: null,
        };
        this.oncardclick = this.oncardclick.bind(this);
    }

    // oncardclick(round: number, game: number)

    renderRound(i: number) {
        if (this.state.activeCard !== null && this.state.activeCard[0] === i) {
            return (
                <RoundColumn
                    round={this.props.week.rounds[i]}
                    active={this.state.activeCard[1]}
                    callbacks={{
                        scoreChanged: this.props.callbacks.scoreChanged,
                        addGame: this.props.callbacks.addGame,
                        cardClick: this.oncardclick,
                    }}
                    players={this.props.players}
                    key={i}
                />
            );
        }
        return (
            <RoundColumn
                round={this.props.week.rounds[i]}
                callbacks={{
                    scoreChanged: this.props.callbacks.scoreChanged,
                    addGame: this.props.callbacks.addGame,
                    cardClick: this.oncardclick,
                }}
                players={this.props.players}
                key={i}
            />
        );
    }

    oncardclick(round: number, game: number) {
        if (this.state.activeCard != null) {
            if (this.state.activeCard[0] === round && this.state.activeCard[1] === game) {
                this.setState({ activeCard: null });
            } else {
                this.setState({ activeCard: [round, game] });
            }
        } else {
            this.setState({ activeCard: [round, game] });
        }
    }

    render() {
        const rows = [];
        for (let i = 0; i < this.props.week.rounds.length; i++) {
            rows.push(this.renderRound(i));
        }
        return (
            <div className="mainweekview">
                {rows}
            </div>
        );
    }
}

export default MainWeekView;
