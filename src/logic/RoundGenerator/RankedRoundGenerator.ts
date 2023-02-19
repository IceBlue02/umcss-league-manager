import { Round } from '../Week';
import {
    RoundGenerator,
    RoundGenPlayer,
    chooseRandom,
    BRUTEFORCEAFTER,
    EARLYREPEATCONST,
    EARLYREPEATFACTOR,
} from './RoundGenerator';

/**
 * Generates a new round, based on previous performance for the gameweek
 *
 * See the README for more details of how our algorithm works.
 */
class RankedRoundGenerator extends RoundGenerator {
    /**
     * Generates a new round based on the performance of players, using a
     * hybrid between greedy and enumeration approaches. See the README for
     * full details.
     * @returns Generated round
     */
    generate(): Round {
        let byePlayerID: number;
        const newRound = new Round(this.week.nextround);
        let players = this.roundplayers;

        // Do we have an odd number of players and therefore need to assign a bye?
        if (players.length % 2 === 1) {
            // Yes- select a player to take the bye.
            byePlayerID = this.selectBye();
            newRound.bye = this.week.players.getPlayerFromID(byePlayerID);

            // Remove the bye taking player from the list
            players = players.filter((p) => p.id !== byePlayerID);
        }

        // The matchup matrix contains the penalty for each game
        let matrix = RankedRoundGenerator.generateMatchupMatrix(players);

        // Until we reach the enumeration stage (recommended: 8), select the best match available
        // (the lowest score), create the game, remove the players from the list
        // and regenerate the matrix
        while (players.length > BRUTEFORCEAFTER) {
            matrix = RankedRoundGenerator.generateMatchupMatrix(players);
            const match = RankedRoundGenerator.selectBestMatch(matrix);
            newRound.createGame([
                this.week.players.getPlayerFromID(match[0]),
                this.week.players.getPlayerFromID(match[1]),
            ]);
            players = players.filter((p) => !match.includes(p.id));
        }

        // Once the greedy stage has been assigned, enumerate the rest of the possible combinations
        matrix = RankedRoundGenerator.generateMatchupMatrix(players);
        const [, matches] = this.recursePossibleMatches([], [...players], 0, matrix);

        // Create games based on the matches
        if (matches != null) {
            for (const match of matches) {
                newRound.createGame([
                    this.week.players.getPlayerFromID(match[0]),
                    this.week.players.getPlayerFromID(match[1]),
                ]);
                players = players.filter((p) => !match.includes(p.id));
            }
        }

        // Check whether all players have been assigned
        if (players.length === 0) {
            newRound.games = RoundGenerator.orderGames(newRound.games);
            return newRound;
        }
        throw new Error('Round could not be generated');
    }

    /**
     * Generates the matchup matrix.
     *
     * The matchup matrix is a 2D map, indexed using player IDs, which details the
     * match value for each possible match. The penalty function works as follows:
     *
     * 1. Difference between the WL proportions
     * 2. If the players have played, penalise by a constant and factor
     *
     * A lower penalty is a better game.
     *
     * Invalid matches (currently only players playing themselves) are signified by -1
     *
     * If the players (and they haven't played all active players)
     * @param players The RoundGenPlayers to be part of the matrix
     * @returns Matchup matrix as described
     */
    static generateMatchupMatrix(players: RoundGenPlayer[]): Map<number, Map<number, number>> {
        const matrix = new Map<number, Map<number, number>>();
        for (const pl1 of players) {
            const row = new Map<number, number>();
            for (const pl2 of players) {
                if (pl1.id === pl2.id) {
                    row.set(pl2.id, -1);
                } else {
                    let difference = Math.abs(pl1.wlProportion - pl2.wlProportion);

                    if (pl1.playedAgainst.get(pl2.id) !== 0) {
                        difference = (difference + EARLYREPEATCONST) * EARLYREPEATFACTOR;
                    }
                    row.set(pl2.id, difference);
                }
            }
            matrix.set(pl1.id, row);
        }
        return matrix;
    }

    /**
     * Selects the lowest value match (greedy approach), with ties broken randomly
     * @param matrix Matchup matrix containing all active players
     * @returns Array with the two player IDs of the chosen match
     */
    static selectBestMatch(matrix: Map<number, Map<number, number>>): number[] {
        const candidateMatches: number[][] = [];
        let minDiff = 99999999;

        // Find the minimum value in the matrix
        for (const row of matrix.values()) {
            for (const diff of row.values()) {
                if (typeof diff === 'number' && diff !== -1 && diff < minDiff) {
                    minDiff = diff as number;
                }
            }
        }

        // Find all matches with the minimum value
        for (const [plid1, row] of matrix.entries()) {
            for (const [plid2, diff] of row.entries()) {
                if (typeof diff === 'number' && diff === minDiff) {
                    candidateMatches.push([plid1, plid2]);
                }
            }
        }
        // 2 versions of the each match will be included, but it won't affect the outcome
        return chooseRandom(candidateMatches);
    }

    /**
     * Recursively enumerates all possible combinations of matches, returning the set and value with
     * the lowest value.
     *
     * This is a fairly direct port of the algorithm I wrote the old C# version. There are many
     * optimisations that could be made, for example moving to an iterative version, however this
     * algorithm has presented good and fast results with using it for the last 4 matches, so
     * so I've focused elsewhere.
     *
     * @param matches - Matches that have already been generated
     * @param players - Remaining players not assigned to a match
     * @param val - Current value of generated matches
     * @param matrix - Matchup Matrix @see GenerateMatchupMatrix
     * @returns Best possible set of matches, and their total value
     */
    recursePossibleMatches(
        matches: number[][],
        players: RoundGenPlayer[],
        val: number,
        matrix: Map<number,
        Map<number, number>>,
    ): [number, number[][] | null] {
        // Exit case, where all matches have been assigned
        if (players.length === 0) {
            return [val, matches];
        }

        // The number of players should always be even (account for byes beforehand)
        if (players.length % 2 === 1) {
            throw new Error('Odd number of players in recursion');
        }

        let currmatches: number[][] | null = [];
        let currbestmatches: number[][] = [];
        let currval = val;
        let currbestval = 9999999;

        // Iterate over all pairs of players
        for (const pl1 of players) {
            for (const pl2 of players) {
                // Match already seen- ignore it
                if (matches.some((m) => m.every((r) => r === pl1.id || r === pl2.id))) {
                    continue;
                }

                const row = matrix.get(pl1.id);
                // If the match between the two players is valid, add a game and recurse
                if (row && row.get(pl2.id) !== undefined && row.get(pl2.id) !== -1) {
                    // Remove players and add match
                    const newPlayers = [...players].filter(
                        (p) => p.id !== pl1.id && p.id !== pl2.id,
                    );
                    const newMatches = [...matches];
                    newMatches.push([pl1.id, pl2.id]);

                    // Add value to running total
                    let newVal = row.get(pl2.id);
                    if (newVal !== undefined) {
                        newVal = val + newVal;
                    } else {
                        throw new Error('Game not in matrix');
                    }

                    // Test other combinations
                    [currval, currmatches] = this.recursePossibleMatches(
                        newMatches,
                        newPlayers,
                        newVal,
                        matrix,
                    );
                    // Was the returned set better than the current best?
                    if (currval !== -1 && currmatches !== null) {
                        if (currval < currbestval) {
                            currbestval = currval;
                            currbestmatches = [...currmatches];
                        }
                    }
                }
            }
        }
        // If we've found a best set, return it, otherwise return null
        if (currbestval !== 99999999) {
            return [currval, currbestmatches];
        }
        return [99999999, null];
    }
}
export default RankedRoundGenerator;
