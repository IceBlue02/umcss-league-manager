import Game from './Game';
import Round from './Round';
import { MembershipType, Player } from './Player';
import PlayerList from './PlayerList';
import RandomRoundGenerator from './RoundGenerator/RandomRoundGenerator';
import RankedRoundGenerator from './RoundGenerator/RankedRoundGenerator';

interface IWeek {
    date: Date;
    rounds: Round[];
    nextround: number;
    players: { 'players': Player[] };
    finished: boolean;
    saved: boolean;
}

function roundToPlaces(value: number, places: number): number {
    return parseFloat((value).toPrecision(places));
}

class Week {
    date: Date;

    rounds: Round[];

    nextround = 1;

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
        const wk = new Week();
        Object.assign(wk, backup);

        const newPL = Object.assign(new PlayerList([]), wk.players);
        for (const p of newPL.players) {
            Object.assign(new Player(-1, '', MembershipType.NONE, false, 0, 0, 0, 0), p);
        }

        wk.rounds = [];
        for (let i = 0; i < backup.rounds.length; i += 1) {
            const rnd = Object.assign(new Round(0), backup.rounds[i]);
            rnd.games = [];
            rnd.bye = Object.assign(new Player(-1, '', MembershipType.NONE, false, 0, 0, 0, 0), backup.rounds[i].bye);
            for (let j = 0; j < backup.rounds[i].games.length; j += 1) {
                let gme = new Game(
                    [new Player(-1, '', MembershipType.NONE, false, 0, 0, 0, 0), new Player(-1, '', MembershipType.NONE, false, 0, 0, 0, 0)],
                    0,
                    0,
                );

                gme = Object.assign(gme, backup.rounds[i].games[j]);
                gme.players = [Object.assign(new Player(-1, '', MembershipType.NONE, false, 0, 0, 0, 0), backup.rounds[i].games[j].players[0]), Object.assign(new Player(-1, '', MembershipType.NONE, false, 0, 0, 0, 0), backup.rounds[i].games[j].players[1])];
                rnd.games.push(gme);
            }
            wk.rounds.push(rnd);
        }

        wk.players = newPL;
        return wk;
    }

    /**
     * Generate the first round of the week, with games assigned completely randomly.
     * @returns Round with randomly generated games
     */
    generateInitialRound() {
        // Generate the initial round, with players randomly matched
        const rg = new RandomRoundGenerator(this);
        const round = rg.generate();
        this.nextround += 1;

        if (round.bye) {
            this.players.setRoundPlayerInfo(round.bye.id);
        } else {
            this.players.setRoundPlayerInfo();
        }

        return round;
    }

    /**
     * Generate the next rouund, using the current results to assign games @see RoundGenerator
     * @returns Round with generated games as per algorithm
     */
    generateNextRound(): Round {
        // Use a round generator to generate a new round
        const rg = new RankedRoundGenerator(this);
        const round = rg.generate();
        this.nextround += 1;

        if (round.bye) {
            this.players.setRoundPlayerInfo(round.bye.id);
        } else {
            this.players.setRoundPlayerInfo();
        }

        return round;
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
                    return;
                }
            }
        }
        this.finished = true;
    }

    /**
     * Gets an array of player ids who have already had a bye this week.
     */
    getPlayersTakenByes() {
        const players = [];
        for (const round of this.rounds) {
            if (round.bye !== null) {
                players.push(round.bye.id);
            }
        }
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
        // Tracks changing ELO live during the round
        const currentElo: Map<number, number> = new Map<number, number>();
        // Holds state of ELO before every round
        let frozenElo: Map<number, number>;
        const wins: Map<number, number> = new Map<number, number>();
        const played: Map<number, number> = new Map<number, number>();

        let scoringlog = '';
        for (const round of this.rounds) {
            // First pass: ensure all players are in currentElo. This needs to be done
            // before scoring as adding players half way through a round will change the ranking
            // scores and negatively affect winning players who played earlier in the round.

            for (const game of round.games) {
                for (const player of game.players) {
                    if (currentElo.get(player.id) === undefined) {
                        currentElo.set(player.id, player.startingelo);
                    }
                    if (wins.get(player.id) === undefined) {
                        wins.set(player.id, player.wins);
                    }

                    if (played.get(player.id) === undefined) {
                        played.set(player.id, player.played);
                    }
                }
            }
            if (round.bye) {
                if (currentElo.get(round.bye.id) === undefined) {
                    currentElo.set(round.bye.id, round.bye.startingelo);
                }
            }

            frozenElo = new Map(currentElo);

            // Freeze the current ELO values before scoring the round
            // (I don't think this matters, but I'm doing it this way out of safety)

            /*  Pass 2: Score the round as follows:
            *   Lower ranked player wins: ELO += 1 + (difference in ELO / 5)
            *   Same or higher ranked player wins: ELO += 1
            *   No change to the losing player
            *   Bye: ELO += 0.5
            *   1 point per week for playing */

            if (round.bye) { // Handle the bye player (if present first)
                const byeElo = currentElo.get(round.bye.id); // Give the bye player half a point
                if (byeElo !== undefined) {
                    currentElo.set(round.bye.id, byeElo + 0.5);
                    console.log(`${round.bye.name} (${byeElo}) received 0.5 for a bye`);
                    scoringlog += `\n${round.bye.name} (${byeElo}) received 0.5 for a bye`;
                } else {
                    throw new Error('Player not in ELO ranking during ranking calculation');
                }
            }

            for (const game of round.games) {
                if (game.scores[0] === game.scores[1]
                    || game.scores[0] === null || game.scores[1] === null) {
                    // Game hasn't finished (or has the same score- shouldn't happen, but ignore)
                    continue;
                } else {
                    // Ensure both players have ELO values already
                    const p1Elo = frozenElo.get(game.players[0].id);
                    const p2Elo = frozenElo.get(game.players[1].id);

                    const p1played = played.get(game.players[0].id);
                    if (p1played !== undefined) {
                        played.set(game.players[0].id, p1played + 1);
                    } else {
                        played.set(game.players[0].id, 1);
                    }

                    const p2played = played.get(game.players[1].id);
                    if (p2played !== undefined) {
                        played.set(game.players[1].id, p2played + 1);
                    } else {
                        played.set(game.players[1].id, 1);
                    }

                    if (p1Elo === undefined || p2Elo === undefined) {
                        throw new Error('Player not in ELO ranking during ranking calculation');
                    }

                    if (game.scores[0] > game.scores[1]) { // First player (p1) won
                        // Calculate difference
                        let rankDiff = p2Elo - p1Elo;
                        // Make difference zero if p1Elo is greater
                        rankDiff = rankDiff < 0 ? 0 : rankDiff;
                        // Add and round to 5
                        currentElo.set(
                            game.players[1].id,
                            roundToPlaces(p1Elo + (rankDiff / 5 + 1), 5),
                        );

                        // Print and add to scoring log
                        console.log(`${game.players[0].name} (${p1Elo}) beat ${game.players[1].name} (${p2Elo}) for a ranking gain of ${roundToPlaces((rankDiff / 5) + 1, 5)}`);
                        scoringlog += `\n${game.players[0].name} (${p1Elo}) beat ${game.players[1].name} (${p2Elo}) for a ranking gain of ${roundToPlaces((rankDiff / 5) + 1, 5)}`;

                        const existingwins = wins.get(game.players[0].id);
                        if (existingwins !== undefined) {
                            wins.set(game.players[0].id, existingwins + 1);
                        } else {
                            wins.set(game.players[0].id, 1);
                        }
                    } else { // Second player (p2) won
                        let rankDiff = p1Elo - p2Elo;
                        rankDiff = rankDiff < 0 ? 0 : rankDiff;
                        currentElo.set(
                            game.players[1].id,
                            roundToPlaces(p2Elo + (rankDiff / 5 + 1), 5),
                        );

                        console.log(`${game.players[1].name} (${p2Elo}) beat ${game.players[0].name} (${p1Elo}) for a ranking gain of ${roundToPlaces((rankDiff / 5) + 1, 5)}`);
                        scoringlog += `\n${game.players[1].name} (${p2Elo}) beat ${game.players[0].name} (${p1Elo}) for a ranking gain of ${roundToPlaces((rankDiff / 5) + 1, 5)}`;

                        const existingwins = wins.get(game.players[1].id);
                        if (existingwins !== undefined) {
                            wins.set(game.players[1].id, existingwins + 1);
                        } else {
                            wins.set(game.players[1].id, 1);
                        }
                    }
                }
            }
        }

        // Add one to each player for participating in the week
        for (const [playerid, elo] of currentElo.entries()) {
            const pl = this.players.getPlayerFromID(playerid);
            pl.currentelo = elo + 1; // Add 1 for participating in week
            pl.elochange = pl.currentelo - pl.startingelo;
            if (final) {
                pl.startingelo = pl.currentelo;
            }
        }
        for (const [playerid, w] of wins.entries()) {
            const pl = this.players.getPlayerFromID(playerid);
            pl.wins = w;
        }

        console.log(played);

        for (const [playerid, p] of played.entries()) {
            const pl = this.players.getPlayerFromID(playerid);
            pl.played = p;
        }

        if (final) {
            window.filesys.savePlayerFile(this.players.getJSON());
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
     * Returns a JSON representation of all data of the week, for backup
     * @returns JSON string representation of the week.
     */
    getCSVRankings(): string {
        let csvdata = 'Player,Played,Wins,Points,Change From Last Week\n';
        const players = this.players.getPlayers();

        players.sort((a, b) => ((a.currentelo > b.currentelo) ? -1 : 1));

        for (const p of players) {
            if (p.currentelo !== 0) {
                const rankstr = `${p.name},${
                    p.played.toString()},${
                    p.wins.toString()},${
                    (Math.round((p.currentelo + Number.EPSILON) * 10000) / 10000).toString()},+${
                    (Math.round((p.elochange + Number.EPSILON) * 10000) / 10000).toString()}\n`;

                csvdata += rankstr;
            }
        }

        return csvdata;
    }

    /**
     * Returns a JSON representation of relevant data of the week, for output at end of week
     * @returns JSON string representation of the week.
     */
    getJSON() {
        // Filters out properties which shouldn't be saved.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replacer = (key: string, value: any) => {
            if (['currentelo', 'inrounds', 'byes', 'playingState', 'seed', 'tempgamessincebye'].includes(key)) {
                return undefined;
            }
            return value;
        };
        const baseJSON = JSON.stringify({
            players: this.players,
            week: { date: this.date, rounds: this.rounds },
        }, replacer);
        window.filesys.saveFile(baseJSON);
    }
}

export type { IWeek };
export { Week, Round };
