/**
 * Represents the stored properties of players when they are saved.
 * 
 * @see Player
 */

interface IPlayer {
    id: number;
    name: string;
    startingelo: number;
    member: boolean;
    ap3: boolean;
}

/**
* Represents whether a player is currently participating in the week
*/
enum PlayingState {
    PLAYING,
    AWAY,
    NOTPLAYING
}

/** 
 * Represents a player.
 */
class Player {
    id: number;
    name: string;
    member: boolean;
    ap3: boolean;
    startingelo: number;
    currentelo: number;
    elochange: number = 0;
    inrounds: boolean[];
    byes: (boolean | null)[];
    seed: number;
    playingState: PlayingState = PlayingState.NOTPLAYING;

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
    constructor(id: number, name: string, member: boolean, ap3: boolean, startingelo: number, currentround?: number) {
    
        this.id = id;
        this.name = name;
        this.startingelo = startingelo;
        this.currentelo = this.startingelo;
        this.elochange = 0;
        this.ap3 = ap3;
        this.member = member;
        this.seed = Math.floor(Math.random() * 1000)// Used to order games properly
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
            return new Player(jsonObj.id, jsonObj.name, jsonObj.member, jsonObj.ap3, jsonObj.startingelo, currentround);
        } else {
            return new Player(jsonObj.id, jsonObj.name, jsonObj.member, jsonObj.ap3, jsonObj.startingelo);
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