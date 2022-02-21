import Game from './Game';
import Round from './Round';
import {Player} from './Player';
import PlayerList from './PlayerList';
import RoundGenerator from './RoundGenerator';
import { emitKeypressEvents } from 'readline';
import { useTouchSensor } from 'react-beautiful-dnd';

type rankingLL = {value: number, playerids: number[], next: rankingLL | null}

interface IPlayerList {
    players: Player[];
}

interface IWeek {
    date: Date;
    rounds: Round[];
    nextround: number;
    players: {"players": Player[]};
    finished: boolean;
    saved: boolean;
}

class Week {
    date: Date;
    rounds: Round[];
    nextround: number = 1;
    players: PlayerList;
    finished: boolean;
    saved: boolean;
    

    constructor(playerList?: PlayerList) {
        this.date = new Date();
        this.rounds = [];
        this.finished = false;
        this.saved = false;
        if (playerList) {
            this.players = playerList;
        } else {
            this.players = new PlayerList([]);
        }
        
    }

    static fromBackup(backup: IWeek): Week {
        var wk = new Week();
        Object.assign(wk, backup);

        var newPL = Object.assign(new PlayerList([]), wk.players)
        for (const p in newPL.players) {
            Object.assign(new Player(-1, "", false, false, 0), p)
        }

        wk.rounds = []
        for (var i = 0; i < backup.rounds.length; i++) {
            let rnd = Object.assign(new Round(0), backup.rounds[i])
            rnd.games = [];
            rnd.bye = Object.assign(new Player(-1, "", false, false, 0), backup.rounds[i].bye)
            for (var j = 0; j < backup.rounds[i].games.length; j++) {
                let gme = new Game(
                    [new Player(-1, "", false, false, 0), new Player(-1, "", false, false, 0)],
                    0, 0)

                gme = Object.assign(gme, backup.rounds[i].games[j])
                gme.players = [Object.assign(new Player(-1, "", false, false, 0), backup.rounds[i].games[j].players[0]), Object.assign(new Player(-1, "", false, false, 0), backup.rounds[i].games[j].players[1])]
                rnd.games.push(gme)
            }
            wk.rounds.push(rnd)
        }

        wk.players = newPL;
        return wk
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

        newRound.games = RoundGenerator.orderGames(newRound.games);

        return newRound
    }

    generateNextRound(): Round {
        var rg = new RoundGenerator(this);
        const round = rg.generate()
        this.nextround++;

        if (round.bye) {
            this.players.setRoundPlayerInfo(round.bye.id)
        } else {
            this.players.setRoundPlayerInfo()
        }

        return round
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


    calculateRankings(final?: boolean) {
        var currentElo: Map<number, number> = new Map<number, number>();    // Tracks changing ELO live during the round
        var frozenElo: Map<number, number>;                                 // Holds state of ELO before every round

        var scoringlog = ""
        for (const round of this.rounds) {

            // First pass: ensure all players are in currentElo. This needs to be done 
            // before scoring as adding players half way through a round will change the ranking 
            // scores and negatively affect winning players who played earlier in the round.

            for (const game of round.games) {
                for (const player of game.players) {
                    if (currentElo.get(player.id) === undefined) {
                        currentElo.set(player.id, player.startingelo)
                    }
                }
            }
            if (round.bye) {
                if (currentElo.get(round.bye.id) === undefined) {
                    currentElo.set(round.bye.id, round.bye.startingelo)
                }
            }

            frozenElo = new Map(currentElo); // Freeze the current ELO values before scoring the round
            // (I don't think this matters, but I'm doing it this way out of safety)

            /*  Pass 2: Score the round as follows:
            *   Lower ranked player wins: ELO += 1 + (difference in ELO / 5)
            *   Same or higher ranked player wins: ELO += 1
            *   No change to the losing player
            *   Bye: ELO += 0.5
            *   1 point per week for playing */

            if (round.bye) {
                const byeElo = currentElo.get(round.bye.id); // Give the bye player half a point
                if (byeElo !== undefined) {    
                    currentElo.set(round.bye.id, round.bye.startingelo + 0.5)
                    console.log(`${round.bye.name} (${byeElo}) received 0.5 for a bye`)
                    scoringlog = scoringlog + `\n${round.bye.name} (${byeElo}) received 0.5 for a bye`
                } else {
                    throw new Error("Player not in ELO ranking during ranking calculation")
                }
            }

            for (const game of round.games) {
                if (game.scores[0] === game.scores[1] || game.scores[0] === null || game.scores[1] === null) {
                    continue; // Game hasn't finished (or has been given the same score- shouldn't happen)
                }
                else {
                    const p1Elo = frozenElo.get(game.players[0].id)
                    const p2Elo = frozenElo.get(game.players[1].id)
                    if (p1Elo === undefined || p2Elo === undefined) {
                        throw new Error("Player not in ELO ranking during ranking calculation")
                    }
                    if (game.scores[0] > game.scores[1]) { // First player won
                        let rankDiff = p2Elo - p1Elo
                        rankDiff = rankDiff < 0 ? 0 : rankDiff
                        currentElo.set(game.players[0].id, parseFloat((p1Elo + (rankDiff / 5) + 1).toPrecision(5)))
                        console.log(`${game.players[0].name} (${p1Elo}) beat ${game.players[1].name} (${p2Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`)
                        scoringlog = scoringlog + `\n${game.players[0].name} (${p1Elo}) beat ${game.players[1].name} (${p2Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`
                    } else {
                        let rankDiff = p1Elo - p2Elo
                        rankDiff = rankDiff < 0 ? 0 : rankDiff
                        currentElo.set(game.players[1].id, parseFloat((p2Elo + (rankDiff / 5) + 1).toPrecision(5)))
                        console.log(`${game.players[1].name} (${p2Elo}) beat ${game.players[0].name} (${p1Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`)
                        scoringlog = scoringlog + `\n${game.players[1].name} (${p2Elo}) beat ${game.players[0].name} (${p1Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`
                    }
                    
                }
            }
        }

        for (const [playerid, elo] of currentElo.entries()) {
            let pl = this.players.getPlayerFromID(playerid)
            pl.currentelo = elo + 1; // Add 1 for participating in week
            pl.elochange = pl.currentelo - pl.startingelo;
            if (final) {
                pl.startingelo = pl.currentelo
            }
        }
        if (final) {
            window.filesys.savePlayerFile(this.players.getJSON())

        }
        window.filesys.saveScoringlog(scoringlog)
    }

    toJSONBackup() {
        return JSON.stringify(this);
    }

    getJSON() {
        const replacer = (key: string, value: any) => {
            if (["currentelo", "inrounds", "byes", "playingState"].includes(key)) {
                return undefined;
            }
            return value
        }
        var baseJSON = JSON.stringify({players: this.players, week: {date: this.date, rounds: this.rounds}}, replacer)
        window.filesys.saveFile(baseJSON);  
    }
}

export type {IWeek}
export {Week, Round};