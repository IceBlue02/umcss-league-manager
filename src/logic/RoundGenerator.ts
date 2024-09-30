import {Week, Round} from "./Week"
import Game from "./Game";

const BRUTEFORCEAFTER = 8;
const EARLYREPEATCONST = 0.1;
const EARLYREPEATFACTOR = 10;

const BYEDISALLOWLIST: Number[] = []

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
type RoundGenPlayer = {
    id: number;
    playedAgainst: Map<number, number>;
    wlProportion: number;
    playedGamesSinceBye: number;
    orderingSeed: number;
}

/**
 * Randomly selects an element from an array.
 * @param array Array to select from.
 * @returns One randomly selected element
 */
function chooseRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

/**
 * Generates a new round.
 * 
 * @see RankedRoundGenerator
 * @see RandomRoundGenerator
 */
abstract class RoundGenerator {
    week: Week
    roundplayers: RoundGenPlayer[]

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
        throw new Error("The ID of the RoundGenPlayer could not be found.");
    }    

    /**
     * Selects a player to take a bye.
     * 
     * The player who has played the most games since a bye will be chosen. A tie will be broken randomly.
     * 
     * @returns ID of the player selected.
     */
    selectBye(): number {
        const maxGamesSinceBye = Math.max(...this.roundplayers.map(pl => pl.playedGamesSinceBye))
        var byeCandidates = [];
        for (const pl of this.roundplayers) {
            if (!(BYEDISALLOWLIST.includes(pl.id)) && pl.playedGamesSinceBye === maxGamesSinceBye) {
                byeCandidates.push(pl.id);
            }
        } 

        if (byeCandidates.length === 0) {
            byeCandidates = this.roundplayers.map(pl => pl.id)
        }
        const byePlayerID = chooseRandom(byeCandidates)
        return byePlayerID
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
            var playedAgainst = new Map<number, number>();

            // Initialise the map with all other players, set to 0
            for (const otherplid of active.map(p => p.id)) { 
                if (plid !== otherplid) {
                    playedAgainst.set(otherplid, 0)
                }
            }

            // Check all games for whether the player has participated
            for (const round of this.week.rounds) {
                for (const game of round.games) {
                    if (game.players[0].id === plid && playedAgainst.has(game.players[1].id)) {   
                        const currval = playedAgainst.get(game.players[1].id)
                        if (currval === undefined) {
                            throw new Error("Undefined player")
                        }
                        playedAgainst.set(game.players[1].id, currval + 1); // Increment the value under the opponents ID
                    } 
                    else if (game.players[1].id === plid && playedAgainst.has(game.players[0].id)) {    
                        const currval = playedAgainst.get(game.players[0].id)
                        if (currval === undefined) {
                            throw new Error("Undefined player")
                        }
                        playedAgainst.set(game.players[0].id, currval + 1);
                    }
                }
            }

            // Adjusts the array if everyone has been played at least once, down
            // so that at least one or more players have been played zero times
            const minNoOfPlayers = Math.min(...Array.from(playedAgainst.values())) 
            if (minNoOfPlayers > 0) {
                for (const [key, value] of playedAgainst.entries()) {
                    playedAgainst.set(key, value - minNoOfPlayers)
                }
            }
            return playedAgainst
        }

        /**
         * Calculates the win/loss proportion of the player. 
         * 
         * If no games have been played, the WL value is 0.5.
         * 
         * @param plid Player to calculate the WL proportion for
         * @returns Win/Loss proportion of the player.
         */
        const getWLProportion = (plid: number): number => {
            var wins = 0, losses = 0;
            // Iterate over every game
            for (const round of this.week.rounds) {
                for (const game of round.games) {
                    // If the game has scores inputted, decide if it is a win or loss
                    if (game.scores[0] !== null && game.scores[1] !== null) {
                        if (game.players[0].id === plid) {
                            if (game.scores[0] > game.scores[1]) {
                                wins++;
                            } else {
                                losses++;
                            }
                        } else if (game.players[1].id === plid) {
                            if (game.scores[1] > game.scores[0]) {
                                wins++;
                            } else {
                                losses++;
                            }
                        }
                    }
                }
            }

            if (wins + losses === 0) {
                return 0.5;
            } else {
                return wins / (wins + losses);
            }
        }

        /**
         * Calculates the number of games a player has played since they last took a bye.
         * @param plid The player ID to calculate for.
         * @returns The number of games since the player took a bye.
         */
        const getPlayedGamesSinceBye = (plid: number): number => {
            const pl = this.week.players.getPlayerFromID(plid);
            return pl.gamessincebye;
        }

        var roundpls = [];

        // Create a RoundGenPlayer for every active player and fill it out
        for (const pl of active) {
            var roundpl: RoundGenPlayer = {
                id: pl.id,
                orderingSeed: pl.seed,
                playedAgainst: getPlayedAgainst(pl.id),
                wlProportion: getWLProportion(pl.id),
                playedGamesSinceBye: getPlayedGamesSinceBye(pl.id)
            }
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
        let seededgames = [];
        // Get the seed total for each game
        for (const game of games) {
            seededgames.push(
                {   g: game,
                    val: game.players[0].seed + game.players[1].seed
                }
            )
        }

        let ordered: {val: number, g: Game}[] = []

        // Insert each value into the new array, insertion sort esque
        for (const sg of seededgames) {
            let inserted = false;
            if (ordered.length === 0) {
                ordered.push(sg);
                continue;
            }
            for (var i = 0; i < ordered.length; i++) {
                
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
        let newgameorder: Game[] = [];
        let gmeno = 1;
        for (const osg of ordered) {
            osg.g.gameno = gmeno
            newgameorder.push(osg.g);
            gmeno++;
        }   

        return newgameorder
    }
}

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
        var byePlayerID: number;
        let newRound = new Round(this.week.nextround)
        let players = this.roundplayers;

        // Do we have an odd number of players and therefore need to assign a bye?
        if (players.length % 2 === 1) {
            // Yes- select a player to take the bye.
            byePlayerID = this.selectBye() 
            newRound.bye = this.week.players.getPlayerFromID(byePlayerID);
            this.week.players.resetGSBforPlayerID(byePlayerID);

            // Remove the bye taking player from the list
            players = players.filter(p => p.id !== byePlayerID)
        }

        // The matchup matrix contains the penalty for each game
        let matrix = this.generateMatchupMatrix(players);

        // Until we reach the enumeration stage (recommended: 8), select the best match available
        // (the lowest score), create the game, remove the players from the list and regenerate the matrix
        while (players.length > BRUTEFORCEAFTER) {
            matrix = this.generateMatchupMatrix(players)
            let match = this.selectBestMatch(matrix);
            newRound.createGame([this.week.players.getPlayerFromID(match[0]), this.week.players.getPlayerFromID(match[1])])
            players = players.filter(p => !match.includes(p.id))
        }

        let matches: number[][] | null;

        // Once the greedy stage has been assigned, enumerate the rest of the possible combinations
        matrix = this.generateMatchupMatrix(players);
        [, matches] = this.recursePossibleMatches([], [...players], 0, matrix)
        
        // Create games based on the matches 
        if (matches != null) {
            for (const match of matches) {
                const p1 = this.week.players.getPlayerFromID(match[0]);
                const p2 = this.week.players.getPlayerFromID(match[1]);
                this.week.players.incrementGSBforPlayerID(p1.id);
                this.week.players.incrementGSBforPlayerID(p2.id);

                newRound.createGame([this.week.players.getPlayerFromID(match[0]), this.week.players.getPlayerFromID(match[1])])
                players = players.filter(p => !match.includes(p.id))
            }
        }

        // Check whether all players have been assigned
        if (players.length === 0) {
            newRound.games = RoundGenerator.orderGames(newRound.games);
            return newRound;
        } else {
            throw new Error("Round could not be generated");
        }
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
    generateMatchupMatrix(players: RoundGenPlayer[]): Map<number, Map<number, number>> {
        var matrix = new Map<number, Map<number, number>>();
        for (const pl1 of players) {
            let row = new Map<number, number>();
            for (const pl2 of players) {
                if (pl1.id === pl2.id) {
                    row.set(pl2.id, -1);
                } else {
                    let difference = Math.abs(pl1.wlProportion - pl2.wlProportion);

                    if (pl1.playedAgainst.get(pl2.id) !== 0) {
                        difference = (difference + EARLYREPEATCONST) * EARLYREPEATFACTOR
                    }
                    row.set(pl2.id, difference);
                }
            }
            matrix.set(pl1.id, row)
        }
        return matrix
    }

    /**
     * Selects the lowest value match (greedy approach), with ties broken randomly
     * @param matrix Matchup matrix containing all active players
     * @returns Array with the two player IDs of the chosen match
     */
    selectBestMatch(matrix: Map<number, Map<number, number>>): number[] {
        var candidateMatches: number[][] = []
        var minDiff = 99999999;

        // Find the minimum value in the matrix
        for (const row of matrix.values()) {
            for (const diff of row.values()) {
                if (typeof diff === "number" && diff !== -1 && diff < minDiff) {
                    minDiff = diff as number;
                }
            }
        }

        // Find all matches with the minimum value
        for (const [plid1, row] of matrix.entries()) {
            for (const [plid2, diff] of row.entries()) {
                if (typeof diff === "number" && diff === minDiff) {
                    candidateMatches.push([plid1, plid2]);
                }
            }
        }
        // 2 versions of the each match will be included, but it won't affect the outcome
        return chooseRandom(candidateMatches)
    }

    /**
     * Recursively enumerates all possible combinations of matches, returning the set and value with
     * the lowest value.
     * 
     * This is a fairly direct port of the algorithm I wrote the old C# version. There are many
     * optimisations that could be made, for example moving to an iterative version, however this algorithm
     * has presented good and fast results with using it for the last 4 matches, so I've focused elsewhere.
     * 
     * @param matches - Matches that have already been generated 
     * @param players - Remaining players not assigned to a match
     * @param val - Current value of generated matches
     * @param matrix - Matchup Matrix @see GenerateMatchupMatrix
     * @returns Best possible set of matches, and their total value
     */
    recursePossibleMatches(matches: number[][], players: RoundGenPlayer[], val: number, matrix: Map<number, Map<number, number>>): [number, number[][] | null] {
        // Exit case, where all matches have been assigned
        if (players.length === 0) {
            return [val, matches];
        } 

        // The number of players should always be even (account for byes beforehand)
        if (players.length % 2 === 1) {
            throw new Error("Odd number of players in recursion")
        }

        var currmatches: number[][] | null = [];
        var currbestmatches: number[][] = [];
        var currval = val;
        var currbestval = 9999999;

        // Iterate over all pairs of players
        for (const pl1 of players) {
            for (const pl2 of players) {
                // Match already seen- ignore it
                if (matches.some(m => m.every(r => r === pl1.id || r === pl2.id))) {
                    continue; 
                }

                const row = matrix.get(pl1.id)
                // If the match between the two players is valid, add a game and recurse
                if (row && row.get(pl2.id) !== undefined && row.get(pl2.id) !== -1) {
                    // Remove players and add match
                    let newPlayers = [...players].filter(p => p.id !== pl1.id && p.id !== pl2.id);
                    let newMatches = [...matches]
                    newMatches.push([pl1.id, pl2.id])

                    // Add value to running total
                    let newVal = row.get(pl2.id)
                    if (newVal !== undefined) {
                        newVal = val + newVal
                    } else {
                        throw new Error("Game not in matrix")
                    }

                    // Test other combinations
                    [currval, currmatches] = this.recursePossibleMatches(newMatches, newPlayers, newVal, matrix)
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
            return [currval, currbestmatches]
        } else {
            return [99999999, null]
        }

    }
}

/**
 * Generates a randomly assigned round, usually used for the first round
 * of the night.
 */
class RandomRoundGenerator extends RoundGenerator {
    generate(): Round {
        var newRound = new Round(this.week.nextround);

            // Randomly shuffle the player list
            let shuffled = this.roundplayers
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)

            if (shuffled.length % 2 === 1) { // If odd number of players, assign the first player a bye
                let byePlayerID = this.selectBye() 
                newRound.bye = this.week.players.getPlayerFromID(byePlayerID);
                this.week.players.resetGSBforPlayerID(byePlayerID);
                shuffled = shuffled.filter(p => p.id !== byePlayerID)
            }

            // Pair the players in consecutive pairs, based on the randomly ordered list, leading to a random set of games
            var gameno = 1;
            while (shuffled.length !== 0) { 
                const p1 = this.week.players.getPlayerFromID(shuffled[0].id);
                const p2 = this.week.players.getPlayerFromID(shuffled[1].id);
                this.week.players.incrementGSBforPlayerID(p1.id);
                this.week.players.incrementGSBforPlayerID(p2.id);

                let game = new Game([p1, p2], newRound.number, gameno)
                shuffled = shuffled.slice(2);
                gameno++
                newRound.addGame(game);
            }

            // Order the games based on the ordering scheme
            newRound.games = RoundGenerator.orderGames(newRound.games);

            return newRound
        }
}

export {RandomRoundGenerator, RankedRoundGenerator}