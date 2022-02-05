import React from 'react';
import MainWeekView from "./MainWeekView"
import {Week} from "../logic/Week"
import update from "immutability-helper"

type MainProps = {
    inweek: Week
}
type MainState = {
    week: Week
}

class Main extends React.Component<MainProps, MainState> {
    state: MainState;

    constructor(props: MainProps) {
        super(props)
        this.state = {
            week: this.props.inweek,
        }
    }

    changeScore(roundno: number, gameno: number, newScore: [number | null, number | null]) {
        if (typeof newScore[0] === "number" && typeof newScore[1] === "number") {
            this.setState(update(this.state, {
                week: {
                    rounds: {
                        roundno: {
                            games: {
                                gameno: {
                                    scores: {$set: newScore},
                                    hasFinished: {$set: true},
                                    isPlaying: {$set: false}
                                }
                            }
                        }
                    }
                }
            }))
        } else {
            if (typeof newScore[0] === "number" && typeof newScore[1] === "number") {
                this.setState(update(this.state, {
                    week: {
                        rounds: {
                            roundno: {
                                games: {
                                    gameno: {
                                        scores: {$set: newScore},
                                        hasFinished: {$set: false},
                                    }
                                }
                            }
                        }
                    }
                }))
            }
        }
    }

    render() {
        return (
            <MainWeekView week={this.state.week} callbacks={{scoreChanged: this.changeScore}}/>
        )
    }
}

export default Main