import Game from './Game';
import {Player} from './Player';

class Week {
    /* Main data class, holding all information over one 'meeting' or 'week' */

    date: Date;          
    games: Game[][];        
    players: Player[];      
    finished: boolean;      // Are all games complete?
    saved: boolean;         // Has this week been saved?

    constructor(players: Player[], playersFilePath: string) {
        this.date = new Date();
        this.games = [];
        this.finished = false;
        this.saved = false;

        this.players = this.loadPlayers(playersFilePath);
    }

    loadPlayers(playersFilePath: string): Player[] { 
        /* Attempts to load a list of players from a json file specified in playersFilePath. */

        let data = fetch('file.json')
        .then(response => response.json())
           
        var players: Player[] = [];
        for (const playerFromFile in data) {
            console.log(playerFromFile);
        }


        return players;
    }
}