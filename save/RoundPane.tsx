
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

