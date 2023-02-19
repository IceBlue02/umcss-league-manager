import { Player } from './Player';

class Game {
    /**
   * Represents one individual game played.
   */

    players: [Player, Player];

    scores: [number | null, number | null];

    round: number;

    gameno: number;

    isPlaying: boolean;

    hasFinished: boolean;

    /**
   * @constructor
   * Creates a game.
   *
   * A game which hasn't been played, or is in progress can be made by ommitting
   * the scores parameter. A game which has finished (abnormal workflow) can be
   * made by including this parameter.
   *
   * @param {[Player, Player]} players - The two players participating in the game.
   * @param {number} round - The round in which the game belongs to.
   * @param {number} gameno - The game number, within the round.
   * @param {[number, number]} [scores] - The score of the game, if it has finished.
   * @param {boolean} [isPlaying] - True if the game is currently playing, otherwise false
   */
    constructor(
        players: [Player, Player],
        round: number,
        gameno: number,
        scores?: [number, number],
        isPlaying?: boolean,
    ) {
        this.players = players;

        // If the scores aren't passed in the constructor (as standard), initialise to [null, null], and
        // set isFinished to false
        if (scores == null) {
            this.scores = [null, null];
            this.hasFinished = false;
        } else {
            this.scores = scores;
            this.hasFinished = true;
        }

        // If isPlaying is not specified in the constructor, assume it to be false.
        if (isPlaying == null) {
            this.isPlaying = false;
        } else {
            this.isPlaying = isPlaying;
        }

        this.round = round;
        this.gameno = gameno;
    }

    /**
     * Checks whether both players have a score inputted and therefore whether the game
     * is considered finished.
     *
     * @returns true if the game is finished, otherwise false
     */
    isFinished(): boolean {
        if (this.scores[0] != null && this.scores[1] != null) {
            if (this.scores[0] !== this.scores[1]) {
                return true;
            }
        }
        return false;
    }
}

export default Game;
