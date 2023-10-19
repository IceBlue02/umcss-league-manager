import Game from './Game';
import Round from './Round';
import {MembershipType, Player} from './Player';
import PlayerList from './PlayerList';
import {RankedRoundGenerator, RandomRoundGenerator} from './RoundGenerator';

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

    /** 
     * Restores a week from backup.
     * 
     * This is an extremely messy and quick solution, which will eventually be replaced
     * with properly defined interfaces and factory methods. For now, it works (just about).
     */
    static fromBackup(backup: IWeek): Week {
        var wk = new Week();
        Object.assign(wk, backup);

        var newPL = Object.assign(new PlayerList([]), wk.players)
        for (const p in newPL.players) {
            Object.assign(new Player(-1, "", MembershipType.NONE, false, 0), p)
        }

        wk.rounds = []
        for (var i = 0; i < backup.rounds.length; i++) {
            let rnd = Object.assign(new Round(0), backup.rounds[i])
            rnd.games = [];
            rnd.bye = Object.assign(new Player(-1, "", MembershipType.NONE, false, 0), backup.rounds[i].bye)
            for (var j = 0; j < backup.rounds[i].games.length; j++) {
                let gme = new Game(
                    [new Player(-1, "", MembershipType.NONE, false, 0), new Player(-1, "", MembershipType.NONE, false, 0)],
                    0, 0)

                gme = Object.assign(gme, backup.rounds[i].games[j])
                gme.players = [Object.assign(new Player(-1, "", MembershipType.NONE, false, 0), backup.rounds[i].games[j].players[0]), Object.assign(new Player(-1, "", MembershipType.NONE, false, 0), backup.rounds[i].games[j].players[1])]
                rnd.games.push(gme)
            }
            wk.rounds.push(rnd)
        }

        wk.players = newPL;
        return wk
    }

    /**
     * Generate the first round of the week, with games assigned completely randomly.
     * @returns Round with randomly generated games
     */
    generateInitialRound() {
        // Generate the initial round, with players randomly matched
        var rg = new RandomRoundGenerator(this);
        const round = rg.generate();
        this.nextround++;

        if (round.bye) {
            this.players.setRoundPlayerInfo(round.bye.id)
        } else {
            this.players.setRoundPlayerInfo()
        }

        return round
    }

    /**
     * Generate the next rouund, using the current results to assign games @see RoundGenerator 
     * @returns Round with generated games as per algorithm
     */
    generateNextRound(): Round {
        // Use a round generator to generate a new round
        var rg = new RankedRoundGenerator(this);
        const round = rg.generate()
        this.nextround++;

        if (round.bye) {
            this.players.setRoundPlayerInfo(round.bye.id)
        } else {
            this.players.setRoundPlayerInfo()
        }

        return round
    }

    /**
     * Tests whether all currently known games are complete and updates this.finished accordingly.
     * @returns true if all games are finished, otherwise false
     */
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


    /** 
     * Calculates each player's ELO based on the games played.
     * 
     * The scoring system works as follows: 
     * 
     * Per game:
     * 1 point for beating a player with a lower ELO than you
     * 1 point + (ELO difference / 5) for beating a player with a higher ELO than you
     * 
     * 0.5 for taking a bye in a round
     * 1 per week for any player who has played a game 
     * 
     * The function returns a string for writing to file, containing all scoring decisions.
     * It also outputs to the console, if it is enabled.
     * 
     * @returns scoring log string, for saving to file
     */
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

            frozenElo = new Map(currentElo);
            
            // Freeze the current ELO values before scoring the round
            // (I don't think this matters, but I'm doing it this way out of safety)

            /*  Pass 2: Score the round as follows:
            *   Lower ranked player wins: ELO += 1 + (difference in ELO / 5)
            *   Same or higher ranked player wins: ELO += 1
            *   No change to the losing player
            *   Bye: ELO += 1
            *   1 point per week for playing */

            if (round.bye) { // Handle the bye player (if present first)
                const byeElo = currentElo.get(round.bye.id); // Give the bye player half a point
                if (byeElo !== undefined) {  
                    currentElo.set(round.bye.id, byeElo + 1)
                    console.log(`${round.bye.name} (${byeElo}) received 1 for a bye`)
                    scoringlog = scoringlog + `\n${round.bye.name} (${byeElo}) received 1 for a bye`
                } else {
                    throw new Error("Player not in ELO ranking during ranking calculation")
                }
            }

            for (const game of round.games) {
                if (game.scores[0] === game.scores[1] || game.scores[0] === null || game.scores[1] === null) {
                    continue; // Game hasn't finished (or has been given the same score- shouldn't happen, but ignore)
                }
                
                // Ensure both players have ELO values already
                const p1Elo = frozenElo.get(game.players[0].id)
                const p2Elo = frozenElo.get(game.players[1].id)
                if (p1Elo === undefined || p2Elo === undefined) {
                    throw new Error("Player not in ELO ranking during ranking calculation")
                }

                const p1 = this.players.getPlayerFromID(game.players[0].id);
                const p2 = this.players.getPlayerFromID(game.players[1].id);

                // Increment played for both players
                p1.played += 1;
                p2.played += 1;

                if (game.scores[0] > game.scores[1]) { // First player (p1) won
                    let rankDiff = p2Elo - p1Elo                // Calculate difference
                    rankDiff = rankDiff < 0 ? 0 : rankDiff      // Make difference zero if p1Elo is greater
                    currentElo.set(game.players[0].id, parseFloat((p1Elo + (rankDiff / 5) + 1).toPrecision(5))) // Add and round to 5

                    // Increment win total
                    p1.wins += 1;

                    // Print and add to scoring log
                    console.log(`${game.players[0].name} (${p1Elo}) beat ${game.players[1].name} (${p2Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`)
                    scoringlog = scoringlog + `\n${game.players[0].name} (${p1Elo}) beat ${game.players[1].name} (${p2Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`
                } 
                else {                                // Second player (p2) won
                    let rankDiff = p1Elo - p2Elo
                    rankDiff = rankDiff < 0 ? 0 : rankDiff
                    currentElo.set(game.players[1].id, parseFloat((p2Elo + (rankDiff / 5) + 1).toPrecision(5)))

                    // Increment win total
                    p2.wins += 1;

                    console.log(`${game.players[1].name} (${p2Elo}) beat ${game.players[0].name} (${p1Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`)
                    scoringlog = scoringlog + `\n${game.players[1].name} (${p2Elo}) beat ${game.players[0].name} (${p1Elo}) for a ranking gain of ${parseFloat(((rankDiff / 5) + 1).toPrecision(5))}`
                }
                    
            }
        }

        // Add one to each player for participating in the week
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
        return scoringlog;
    }

    /**
     * Returns a JSON representation of all data of the week, for backup
     * @returns JSON string representation of the week.
     */
    toJSONBackup() {
        return JSON.stringify(this);
    }

    /**
     * Returns a CSV representation of the current leaderboard
     * @returns CSV representation of the current leaderboard
     */
    getCSVRankings(): String {
        var csvdata = " ,Name,Played,Wins,W/L,Points,+/-\n";
        var players = this.players.getPlayers();

        let prevScore = -1;
        let place = 0;
        let numPlayers = 0;

        players.sort((a, b) => (a.currentelo > b.currentelo) ? -1 : 1);

        for (const p of players) {
            if (p.currentelo === 0) {
                continue
            }

            numPlayers += 1;

            let currScore = (Math.round((p.currentelo + Number.EPSILON) * 1000) / 1000);
            let change = (Math.round((p.elochange + Number.EPSILON) * 1000) / 1000);
            let wlrecord = (Math.round(((p.wins / p.played) + Number.EPSILON) * 1000) / 1000);

            if (currScore !== prevScore) {
                // Only increment the place score if the previous score doesn't match the current one
                place = numPlayers;
                prevScore = currScore;
            }

            let rankstr = place.toString() + "," + p.name + "," + p.played.toString() + "," + p.wins.toString()
                + "," + wlrecord.toString() + "," + currScore.toString() + "," + change.toString() + "\n";

            csvdata = csvdata + rankstr;

        }

        return csvdata
    }

    /**
     * Returns a JSON representation of relevant data of the week, for output at end of week
     * @returns JSON string representation of the week.
     */
    getJSON() {
        // Filters out properties which shouldn't be saved.
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