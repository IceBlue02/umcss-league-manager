import { Week, Round } from '../Week';
import Game from '../Game';

export const BRUTEFORCEAFTER = 8;
export const EARLYREPEATCONST = 0.1;
export const EARLYREPEATFACTOR = 10;

/**
 * Information used when generating a round
 *
 * id: The ID of the player
 * playedAgainst: PlayerID -> Integer, representing the number of times a player has played against
 * the other played (represented buy their player ID)
 * wlProportion: Float 0-1, the proportion of games they have won in this week.
 * playedGamesSinceBye: The number of games the player has played since they took a bye.
 * orderingSeed: The player's seed, used when ordering games
 */
export type RoundGenPlayer = {
    id: number;
    playedAgainst: Map<number, number>;
    wlProportion: number;
    gamesSinceBye: number;
    orderingSeed: number;
};

/**
 * Randomly selects an element from an array.
 * @param array Array to select from.
 * @returns One randomly selected element
 */
export function chooseRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a new round.
 *
 * @see RankedRoundGenerator
 * @see RandomRoundGenerator
 */
export abstract class RoundGenerator {
    week: Week;

    roundplayers: RoundGenPlayer[];

    constructor(week: Week) {
        this.week = week;
        this.roundplayers = this.getRoundGenPlayers();
    }

    abstract generate(): Round;

    /**
     * Finds the RoundGenPlayer of the given ID.
     *
     * @param plid ID to return the RoundGenPlayer for.
     * @returns RoundGenPlayer correstponding to the given ID.
     */
    getRoundPlayer(plid: number): RoundGenPlayer {
        for (const r of this.roundplayers) {
            if (r.id === plid) {
                return r;
            }
        }
        throw new Error('The ID of the RoundGenPlayer could not be found.');
    }

    /**
     * Selects a player to take a bye.
     *
     * The player who has played the most games since a bye will be chosen.
     * A tie will be broken randomly.
     *
     * @returns ID of the player selected.
     */
    selectBye(): number {
        const maxGamesSinceBye = Math.max(...this.roundplayers.map((pl) => pl.gamesSinceBye));
        const byeCandidates = [];
        for (const pl of this.roundplayers) {
            if (pl.gamesSinceBye === maxGamesSinceBye) {
                byeCandidates.push(pl.id);
            }
        }
        const byePlayerID = chooseRandom(byeCandidates);
        return byePlayerID;
    }

    /**
     * Calculates all the required data for round generation, forming
     * RoundGenPlayer objects with the data.
     *
     * @returns A RoundGenPlayer for each active player
     */
    getRoundGenPlayers(): RoundGenPlayer[] {
        // We only work with active players when generating a round.
        const active = this.week.players.getActivePlayers();

        /**
         * Calculates the playedAgainst map for a particular player. If the player has played
         * all other active players, the values are adjusted down so at least one player has
         * been played zero times (by subtracting the minimum value from all) to avoid unnecessary
         * penalisation.
         *
         * The map follows the form
         * PlayerID : Number of games played against that player
         *
         * @param plid The player to calculate the map against
         * @returns Map of the above form
         */
        const getPlayedAgainst = (plid: number): Map<number, number> => {
            const playedAgainst = new Map<number, number>();

            // Initialise the map with all other players, set to 0
            for (const otherplid of active.map((p) => p.id)) {
                if (plid !== otherplid) {
                    playedAgainst.set(otherplid, 0);
                }
            }

            // Check all games for whether the player has participated
            for (const round of this.week.rounds) {
                for (const game of round.games) {
                    if (game.players[0].id === plid && playedAgainst.has(game.players[1].id)) {
                        const currval = playedAgainst.get(game.players[1].id);
                        if (currval === undefined) {
                            throw new Error('Undefined player');
                        }
                        // Increment the value under the opponents ID
                        playedAgainst.set(game.players[1].id, currval + 1);
                    } else if (game.players[1].id === plid
                        && playedAgainst.has(game.players[0].id)) {
                        const currval = playedAgainst.get(game.players[0].id);
                        if (currval === undefined) {
                            throw new Error('Undefined player');
                        }
                        playedAgainst.set(game.players[0].id, currval + 1);
                    }
                }
            }

            // Adjusts the array if everyone has been played at least once, down
            // so that at least one or more players have been played zero times
            const minNoOfPlayers = Math.min(...Array.from(playedAgainst.values()));
            if (minNoOfPlayers > 0) {
                for (const [key, value] of playedAgainst.entries()) {
                    playedAgainst.set(key, value - minNoOfPlayers);
                }
            }
            return playedAgainst;
        };

        /**
         * Calculates the win/loss proportion of the player.
         *
         * If no games have been played, the WL value is 0.5.
         *
         * @param plid Player to calculate the WL proportion for
         * @returns Win/Loss proportion of the player.
         */
        const getWLProportion = (plid: number): number => {
            let wins = 0; let
                losses = 0;
            // Iterate over every game
            for (const round of this.week.rounds) {
                for (const game of round.games) {
                    // If the game has scores inputted, decide if it is a win or loss
                    if (game.scores[0] !== null && game.scores[1] !== null) {
                        if (game.players[0].id === plid) {
                            if (game.scores[0] > game.scores[1]) {
                                wins += 1;
                            } else {
                                losses += 1;
                            }
                        } else if (game.players[1].id === plid) {
                            if (game.scores[1] > game.scores[0]) {
                                wins += 1;
                            } else {
                                losses += 1;
                            }
                        }
                    }
                }
            }

            if (wins + losses === 0) {
                return 0.5;
            }
            return wins / (wins + losses);
        };

        /**
         * Calculates the number of games a player has played since they last took a bye.
         * @param plid The player ID to calculate for.
         * @returns The number of games since the player took a bye.
         */
        const getPlayedGamesSinceBye = (plid: number): number => {
            // const pl = this.week.players.getPlayerFromID(plid);
            // var count = 0;
            // for (var i = pl.byes.length-1; i >= 0; i--) {
            //     if (pl.byes[i] == null) {
            //         continue;       // Didn't participate in this round
            //     } else if (!pl.byes[i]) {
            //         count += 1;        // Played in the round
            //     } else {
            //         return count    // Bye
            //     }
            // }
            // return count

            const pl = this.week.players.getPlayerFromID(plid);
            return pl.gamessincebye;
        };

        const roundpls = [];

        // Create a RoundGenPlayer for every active player and fill it out
        for (const pl of active) {
            const roundpl: RoundGenPlayer = {
                id: pl.id,
                orderingSeed: pl.seed,
                playedAgainst: getPlayedAgainst(pl.id),
                wlProportion: getWLProportion(pl.id),
                gamesSinceBye: getPlayedGamesSinceBye(pl.id),
            };
            roundpls.push(roundpl);
        }

        return roundpls;
    }

    /**
     * Order the games based on the ordering seeds.
     *
     * Each player has a randomly assigned (per week) seed, between 0 and
     * 10000. Games are ordered then by the total of the two players seeds.
     * See the README as to why this is useful.
     *
     * @param games Array of generated games
     * @returns Reordered array of games
     */
    static orderGames(games: Game[]): Game[] {
        const seededgames = [];
        // Get the seed total for each game
        for (const game of games) {
            seededgames.push(
                {
                    g: game,
                    val: game.players[0].seed + game.players[1].seed,
                },
            );
        }

        const ordered: { val: number, g: Game }[] = [];

        // Insert each value into the new array, insertion sort esque
        for (const sg of seededgames) {
            let inserted = false;
            if (ordered.length === 0) {
                ordered.push(sg);
                continue;
            }
            for (let i = 0; i < ordered.length; i += 1) {
                if (sg.val < ordered[i].val) {
                    ordered.splice(i, 0, sg);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                ordered.push(sg);
            }
        }

        // Renumber all the games to reflect the new order
        const newgameorder: Game[] = [];
        let gmeno = 1;
        for (const osg of ordered) {
            osg.g.gameno = gmeno;
            newgameorder.push(osg.g);
            gmeno += 1;
        }

        return newgameorder;
    }
}
