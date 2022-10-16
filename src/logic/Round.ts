import Game from "./Game"
import {Player} from "./Player"

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

    getHighestGameNo() {
        var highest = 0;
        for (const g of this.games) {
            if (g.gameno > highest) {
                highest = g.gameno;
            }
        }
        return highest
    }

    createGame(players: [Player, Player]) {
        this.games.push(new Game(players, this.number, this.games.length+1));
    }

    getGames(): Game[] {
        return this.games
    }
}

export default Round