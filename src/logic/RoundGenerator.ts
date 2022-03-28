import {Week, Round} from "./Week"
import Game from "./Game";

const BRUTEFORCEAFTER = 8;
const EARLYREPEATCONST = 0.1;
const EARLYREPEATFACTOR = 10;

type RoundGenPlayer = {
    id: number;
    playedAgainst: Map<number, number>;
    wlProportion: number;
    playedGamesSinceBye: number;
    orderingseed: number;
}

function random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

class RoundGenerator {
    week: Week
    roundplayers: RoundGenPlayer[]

    constructor(week: Week) {
        this.week = week;
        this.roundplayers = this.getRoundGenPlayers();
    }

    getRoundPlayer(plid: number): RoundGenPlayer {
        for (const r of this.roundplayers) {
            if (r.id === plid) {
                return r;
            }
        }
        throw new Error("Something went wrong when generating");
    }

    generateRandom(): Round {
        var players = this.roundplayers;
        var newRound = new Round(this.week.nextround);

        // Randomly shuffle the player list
        let shuffled = this.roundplayers
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

        if (shuffled.length % 2 === 1) { // If odd number of players, assign the first player a bye
            let byePlayerID = this.selectBye() 
            newRound.bye = this.week.players.getPlayerFromID(byePlayerID);
            shuffled = shuffled.filter(p => p.id !== byePlayerID)
        }

        // Pair the players in consecutive pairs, based on the randomly ordered list, leading to a random set of games
        var gameno = 1;
        while (shuffled.length !== 0) { 
            let game = new Game([this.week.players.getPlayerFromID(shuffled[0].id), 
                                this.week.players.getPlayerFromID(shuffled[1].id)], newRound.number, gameno)
            shuffled = shuffled.slice(2);
            gameno++
            newRound.addGame(game);
        }

        // Order the games based on the ordering scheme
        newRound.games = RoundGenerator.orderGames(newRound.games);

        return newRound
    }

    generate(): Round {
        var chosenRound;
        var byePlayerID: number;

        for (var attempt = 0; attempt < 100; attempt++) { // Repeat until we have a match
            let newRound = new Round(this.week.nextround)
            let players = this.roundplayers;

            if (players.length % 2 === 1) {
                byePlayerID = this.selectBye() 
                newRound.bye = this.week.players.getPlayerFromID(byePlayerID);
                players = players.filter(p => p.id !== byePlayerID)
            }

            let matrix = this.generateMatchupMatrix(players);

            while (players.length > BRUTEFORCEAFTER) {
                matrix = this.generateMatchupMatrix(players)
                let match = this.selectBestMatch(matrix);
                newRound.createGame([this.week.players.getPlayerFromID(match[0]), this.week.players.getPlayerFromID(match[1])])
                players = players.filter(p => !match.includes(p.id))
            }

            let matches: number[][] | null;
            let val: number;

            matrix = this.generateMatchupMatrix(players);
            [val, matches] = this.recursePossibleMatches([], [...players], 0, matrix)
            console.log(val);
            
            if (matches != null) {
                for (const match of matches) {
                    newRound.createGame([this.week.players.getPlayerFromID(match[0]), this.week.players.getPlayerFromID(match[1])])
                    players = players.filter(p => !match.includes(p.id))
                }
            }

            if (players.length === 0) {
                chosenRound = newRound;
                break;
            }
        }

        if (chosenRound) {
            chosenRound.games = RoundGenerator.orderGames(chosenRound.games);
            return chosenRound;
        } else {
            throw new Error("Round could not be generated");
        }
        
    }

    selectBye(): number {
        const maxGamesSinceBye = Math.max(...this.roundplayers.map(pl => pl.playedGamesSinceBye))
        var byeCandidates = [];
        for (const pl of this.roundplayers) {
            if (pl.playedGamesSinceBye === maxGamesSinceBye) {
                byeCandidates.push(pl.id);
            }
        }
        const byePlayerID = random(byeCandidates)
        return byePlayerID
    }

    recursePossibleMatches(matches: number[][], players: RoundGenPlayer[], val: number, matrix: Map<number, Map<number, number>>): [number, number[][] | null] {
        if (players.length === 0) {
            return [val, matches];
        } 

        if (players.length % 2 === 1) {
            throw new Error("Odd number of players in recursion")
        }

        var currmatches: number[][] | null = [];
        var currbestmatches: number[][] = [];
        var currval = val;
        var currbestval = 9999999;

        for (const pl1 of players) {
            for (const pl2 of players) {
                if (matches.some(m => m.every(r => r === pl1.id || r === pl2.id))) {
                    continue; // match has already been seen
                }

                const row = matrix.get(pl1.id)
                if (row && row.get(pl2.id) !== undefined && row.get(pl2.id) !== -1) {
                    let newPlayers = [...players].filter(p => p.id !== pl1.id && p.id !== pl2.id);
                    let newMatches = [...matches]
                    newMatches.push([pl1.id, pl2.id])

                    let newVal = row.get(pl2.id)
                    if (newVal !== undefined) {
                        newVal = val + newVal
                    } else {
                        throw new Error("Game not in matrix")
                    }

                    [currval, currmatches] = this.recursePossibleMatches(newMatches, newPlayers, newVal, matrix)
                    if (currval !== -1 && currmatches !== null) {
                        if (currval < currbestval) {
                            currbestval = currval;
                            currbestmatches = [...currmatches];
                        }
                    }
                }
                 
            }
        }

        if (currbestval !== 99999999) {
            return [currval, currbestmatches]
        } else {
            return [99999999, null]
        }

    }

    generateMatchupMatrix(players: RoundGenPlayer[]): Map<number, Map<number, number>> {
        var matrix = new Map<number, Map<number, number>>();
        for (const pl1 of players) {
            let row = new Map<number, number>();
            for (const pl2 of players) {
                if (pl1.id === pl2.id) {
                    row.set(pl2.id, -1);
                } else {
                    let difference = Math.abs(pl1.wlProportion - pl2.wlProportion);
                    difference = Math.pow(difference, 3)

                    if (pl1.playedAgainst.get(pl2.id) !== 0) {
                        difference = (difference + EARLYREPEATCONST) * EARLYREPEATFACTOR
                    }
                    // Additional weighting by ordering seed to try and get a better order where games are simular
                    difference += (pl1.orderingseed + pl2.orderingseed) / 1000000
                    row.set(pl2.id, difference);
                }
            }
            matrix.set(pl1.id, row)
        }
        return matrix
    }

    selectBestMatch(matrix: Map<number, Map<number, number>>): number[] {
        var candidateMatches: number[][] = []
        var minDiff = 99999999;

        for (const row of matrix.values()) {
            for (const diff of row.values()) {
                if (typeof diff === "number" && diff !== -1 && diff < minDiff) {
                    minDiff = diff as number;
                }
            }
        }

        for (const [plid1, row] of matrix.entries()) {
            for (const [plid2, diff] of row.entries()) {
                if (typeof diff === "number" && diff === minDiff) {
                    candidateMatches.push([plid1, plid2]);
                }
            }
        }
        // 2 versions of the each match will be included, but it won't affect the outcome
        console.log(candidateMatches)
        return random(candidateMatches)
    }

    getRoundGenPlayers(): RoundGenPlayer[] {
        const active = this.week.players.getActivePlayers();
        const getPlayedAgainst = (plid: number): Map<number, number> => {
            var playedAgainst = new Map<number, number>();

            for (const otherplid of active.map(p => p.id)) { // Initialise map with all other players
                if (plid !== otherplid) {
                    playedAgainst.set(otherplid, 0)
                }
            }

            for (const round of this.week.rounds) {
                for (const game of round.games) {
                    if (game.players[0].id === plid && playedAgainst.has(game.players[1].id)) { // Game with another active player    
                        const currval = playedAgainst.get(game.players[1].id)
                        if (currval === undefined) {
                            throw new Error("Undefined player")
                        }
                        playedAgainst.set(game.players[1].id, currval + 1);
                    } 
                    else if (game.players[1].id === plid && playedAgainst.has(game.players[0].id)) { // Game with another active player    
                        const currval = playedAgainst.get(game.players[0].id)
                        if (currval === undefined) {
                            throw new Error("Undefined player")
                        }
                        playedAgainst.set(game.players[0].id, currval + 1);
                    }
                }
            }

            const minNoOfPlayers = Math.min(...Array.from(playedAgainst.values())) // Adjusts the array if everyone has been played at least once
            if (minNoOfPlayers > 0) {
                for (const [key, value] of playedAgainst.entries()) {
                    playedAgainst.set(key, value - minNoOfPlayers)
                }
            }
            return playedAgainst
        }

        const getWLProportion = (plid: number): number => {
            var wins = 0, losses = 0;
            for (const round of this.week.rounds) {
                for (const game of round.games) {
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

        const getPlayedGamesSinceBye = (plid: number): number => {
            const pl = this.week.players.getPlayerFromID(plid);
            var count = 0;
            for (var i = pl.byes.length-1; i >= 0; i--) {
                if (pl.byes[i] == null) {
                    continue; // Didn't participate in this round
                } else if (!pl.byes[i]) {
                    count++; // Played in the round
                } else {
                    return count // Bye
                }
            }
            return count
        }

        var roundpls = [];

        for (const pl of active) {
            var roundpl: RoundGenPlayer = {
                id: pl.id,
                orderingseed: pl.seed,
                playedAgainst: getPlayedAgainst(pl.id),
                wlProportion: getWLProportion(pl.id),
                playedGamesSinceBye: getPlayedGamesSinceBye(pl.id)
            }
            roundpls.push(roundpl);
        }

        return roundpls;
    }

    static orderGames(games: Game[]): Game[] {
        let seededgames = [];
        for (const game of games) {
            seededgames.push(
                {   g: game,
                    val: game.players[0].seed + game.players[1].seed
                }
            )
        }

        let ordered: {val: number, g: Game}[] = []

        for (const sg of seededgames) {
            // Bubble sort, but oh well at worst it's 20 games
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

export default RoundGenerator