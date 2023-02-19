import { Round } from '../Week';
import Game from '../Game';
import { RoundGenerator } from './RoundGenerator';

/**
 * Generates a randomly assigned round, usually used for the first round
 * of the night.
 */
class RandomRoundGenerator extends RoundGenerator {
    generate(): Round {
        const newRound = new Round(this.week.nextround);

        // Randomly shuffle the player list
        let shuffled = this.roundplayers
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        if (shuffled.length % 2 === 1) { // If odd number of players, assign the first player a bye
            const byePlayerID = this.selectBye();
            newRound.bye = this.week.players.getPlayerFromID(byePlayerID);
            shuffled = shuffled.filter((p) => p.id !== byePlayerID);
        }

        // Pair the players in consecutive pairs, based on the randomly ordered list,
        // leading to a random set of games
        let gameno = 1;
        while (shuffled.length !== 0) {
            const game = new Game(
                [
                    this.week.players.getPlayerFromID(shuffled[0].id),
                    this.week.players.getPlayerFromID(shuffled[1].id),
                ],
                newRound.number,
                gameno,
            );
            shuffled = shuffled.slice(2);
            gameno += 1;
            newRound.addGame(game);
        }

        // Order the games based on the ordering scheme
        newRound.games = RoundGenerator.orderGames(newRound.games);

        return newRound;
    }
}

export default RandomRoundGenerator;
