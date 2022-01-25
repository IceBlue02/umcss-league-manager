import {Player} from './Player';

class Game {
    players: [Player, Player];
    scores: [number|null, number|null]
    round: number;
    gameno: number;
    isPlaying: boolean;
    hasFinished: boolean

    constructor(players: [Player, Player], round: number, gameno: number, scores?: [number, number],
                isPlaying?: boolean) {
        this.players = players;

        if (scores == null) {
            this.scores = [null, null];
            this.hasFinished = false;
        } else {
            this.scores = scores;
            this.hasFinished = true;
        }

        if (isPlaying == null) {
            this.isPlaying = false;
        } else {
            this.isPlaying = isPlaying;
        }

        this.round = round;
        this.gameno = gameno;
    }
}

export default Game