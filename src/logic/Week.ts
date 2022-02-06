import Game from './Game';
import {Player} from './Player';
import PlayerList from './PlayerList';

class Round {
    games: Game[] = [];
    bye: Player | null = null;
    number: number;

    constructor(number: number) {
        this.number = number;
    }

    setBye(pl: Player) {
        this.bye = pl;
    }

    setGames(games: Game[]): void {
        this.games = games;
    }

    addGame(game: Game) {
        this.games.push(game);
    }

    getGames(): Game[] {
        return this.games
    }
}

class Week {
    date: Date;
    rounds: Round[];
    nextround: number = 1;
    players: PlayerList;
    finished: boolean;
    saved: boolean;
    

    constructor(playerList: PlayerList) {
        this.date = new Date();
        this.rounds = [];
        this.finished = false;
        this.saved = false;
        this.players = playerList;
    }

    

    generateInitialRound() {
        var activePlayers = this.players.getActivePlayers();
        var byePlayer: Player | undefined;
        var newRound = new Round(this.nextround);
        this.nextround++;

        let shuffled = activePlayers // Shuffles the playerlist randomly
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

        if (shuffled.length % 2 === 1) { // If odd number of players, assign the first player a bye
            byePlayer = shuffled[0];
            shuffled.shift();
        }

        var gameno = 1;
        while (shuffled.length !== 0) { // Pair each player using the first 2 elements in the random list
            let game = new Game([shuffled[0], shuffled[1]], newRound.number, gameno)
            shuffled = shuffled.slice(2);
            gameno++
            newRound.addGame(game);
        }

        if (byePlayer) {
            newRound.setBye(byePlayer);
            this.players.setRoundPlayerInfo(byePlayer.id)
        } else {
            this.players.setRoundPlayerInfo()
        }

        this.rounds.push(newRound);
    }

    checkFinished() {
        for (const round of this.rounds) {
            for (const game of round.getGames()) {
                if (game.hasFinished === false) {
                    this.finished = false;
                    return
                }
            }
        }
        this.finished = true;
    }
}

export {Week, Round};