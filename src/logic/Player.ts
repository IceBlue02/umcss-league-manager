/**
 * Represents the stored properties of players when they are saved.
 * 
 * @see Player
 */

interface IPlayer {
    id: number;
    name: string;
    startingelo: number;
}

/**
* Represents whether a player is currently participating in the week
*/
enum PlayingState {
    active,     // The player is present and should be included in the next round
    notplaying, // The player is not present
    inactive    // The player is temporarily away 
}

/** 
 * Represents a player.
 */
class Player {
    id: number;
    name: string;
    startingelo: number;
    currentelo: number;
    inrounds: boolean[];
    byes: (boolean | null)[];
    playingState: PlayingState = PlayingState.inactive;

    /**
     * @constructor
     * Creates a new player.
     * 
     * @param id - Player ID, unique, remains constant once assigned
     * @param name - The name of the player
     * @param startingelo - The players starting ELO at the beginning of the night
     * @param currentround - The current round. If later in the week, inround and null need to
     * be adjusted to ensure they are consistant with all other players
     */
    constructor(id: number, name: string, startingelo: number, currentround?: number) {
    
        this.id = id;
        this.name = name;
        this.startingelo = startingelo;
        this.currentelo = this.startingelo;
        this.inrounds = [];
        this.byes = [];

        if (currentround != null) {
            for (var i = 0; i < currentround; i++) {
                this.inrounds.push(false);
                this.byes.push(null);
            }
        }
    }

    /**
     * Creates a player object from parsed JSON.
     * 
     * @param jsonObj Player interface from the parsed JSON.
     * @param currentround - The current round (see above)
     * @returns Player, with the required attributes
     */
    static fromJSON(jsonObj: IPlayer, currentround?: number): Player {
        if (typeof(currentround) != "undefined") {
            return new Player(jsonObj.id, jsonObj.name, jsonObj.startingelo, currentround);
        } else {
            return new Player(jsonObj.id, jsonObj.name, jsonObj.startingelo);
        }
    }
}

/**
 * Holds all players currently known to the application
 */
class PlayerList {
    players: Player[];
    
    constructor(jsonData: IPlayer[]) {
        console.log(jsonData);
        this.players = [];
        for (const jsonObj of jsonData) {
            this.players.push(
                Player.fromJSON(jsonObj)
            );
        }
    }

    /**
     * Returns the array of player opjects
     * 
     * @returns Array of all players in the application
     */
    getPlayers(): Player[] {
        return this.players;
    }

    /**
     * Gets the player correstponding to the given ID
     * 
     * @param id The ID of the player to search for
     * @returns Player correstponding to the ID, or null if the ID is not found.
     */
    getPlayerFromID(id: number): Player {
        for (const pl of this.players) {
            if (pl.id === id) {
                return pl;
            }
        }
        throw new Error(`Player ${id} not found`);
    }
}

export {Player, PlayingState}
export type {IPlayer}