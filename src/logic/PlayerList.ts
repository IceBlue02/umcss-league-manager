import {IPlayer, Player, PlayingState, MembershipType} from "./Player";

/**
 * Holds all players currently known to the application
 */
class PlayerList {
    players: Player[];
    

    /**
     * Instantiates a new PlayerList.
     * 
     * Optionally, a JSON 
     * 
     * @param [jsonData] - JSON data to load into the player list. 
     */
    constructor(jsonData?: IPlayer[]) {
        this.players = [];
        if (jsonData) {
            for (const jsonObj of jsonData) {
                this.players.push(
                    Player.fromJSON(jsonObj)
                );
            }
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
     * Generates a new blank player object, with a unique ID.
     * 
     * @returns New player object, with ID set
     */
    getNewPlayer(): Player {
        var id = -1;
        while (id === -1 || this.isIDAssigned(id)) {
            id = Math.floor(Math.random() * 99999999);
        }
        return new Player(id, "", MembershipType.NONE, false, 0);
    }

    /**
     * Tests whether a given ID has already been assigned or not.
     * @param id ID to test (0-99999999)
     * @returns True if the ID is assigned, otherwise false
     */
    isIDAssigned(id: number) {
        for (const pl of this.players) {
            if (pl.id === id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the player at a given index in the players array.
     * 
     * Throws an error if the index is out of bounds.
     * 
     * @param index - Index of the player to return
     * @returns Player correstponding to index
     */
     getPlayerFromIndex(indx: number): Player | null {
        if (0 <= indx && indx < this.players.length) {
            return this.players[indx];
        } else {
            throw new Error(`Index ${indx} is out of range when `)
        }
    }
    
    /**
     * Gets the player correstponding to the given index in the players list.
     * 
     * Returns null if the index is out of range.
     * 
     * @param id The ID of the player to search for
     * @returns Player correstponding to the ID, or null if the ID is not found.
     */
    getIndexFromID(id: number): number {
        var indx = 0;
        for (const pl of this.players) {
            if (pl.id === id) {
                return indx;
            }
            indx++;
        }
        throw new Error(`Player ${id} not found`);
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

    /**
     * Gets the player correstponding to the given name (exact match, case insensitive)
     * 
     * @param name The name of the player to search for
     * @returns Player correstponding to the name, or null if the name is not found.
     */
    getPlayerFromName(name: string): Player | null {
        for (const pl of this.players) {
            if (pl.name.toLowerCase().includes(name.toLowerCase())) {
                return pl;
            }
        }
        return null;
    }

    /**
     * Gets all players with their playing state set to active.
     * 
     * @returns Array of all players who are active
     */
    getActivePlayers(): Player[] {
        var players: Player[] = [];
        for (const pl of this.players) {
            if (pl.playingState === PlayingState.PLAYING) {
                players.push(pl)
            }
        }
        return players;
    }

    /**
     * Gets all players with a matching state to the state given
     * @param state Playing state to return matches for
     * @returns Array of players with matching player state
     */
    getPlayersWithState(state: PlayingState): Player[] {
        var players: Player[] = [];
        for (const pl of this.players) {
            if (pl.playingState === state) {
                players.push(pl)
            }
        }
        return players;
    }

    /**
     * Sets the individual player data when a new round is made.
     * 
     * When a new round is made, the inrounds and byes fields of each player is updated: 
     * inrounds: True if the player is assigned is active, otherwise False
     * byes: 
     *      true if the player is taking a bye
     *      false if the player is active, not taking a bye, but someone else is
     *      null otherwise (not playing, or no bye being taken)
     * 
     * This method is called when a round is created to update all players
     * 
     * @param [byeID] - The ID of a player assigned a bye, if one has been assigned.
     * 
     * @returns Array of all players who are active
     */
    setRoundPlayerInfo(byeID?: number) { 
        for (const pl of this.players) {
            if (pl.playingState === PlayingState.AWAY || pl.playingState === PlayingState.NOTPLAYING) {
                // Player not in this round
                pl.inrounds.push(false);
                pl.byes.push(null);
            } else {
                // Player in this round
                pl.inrounds.push(true);
                if (typeof byeID != "undefined") {
                    if (byeID === pl.id) {
                        pl.byes.push(true); // taking a bye
                    } else {
                        pl.byes.push(false) // not taking a bye, but someone is
                    }
                } else {
                    pl.byes.push(null) // no one is taking a bye this round
                }
            }
        }
    }

    incrementGSBforPlayerID(id: number) {
        this.players[this.getIndexFromID(id)].gamessincebye++;
    }

    resetGSBforPlayerID(id: number) {
        this.players[this.getIndexFromID(id)].gamessincebye = 0;
    }

    finaliseRanks() {
        for (var pl of this.players) {
            pl.startingelo = pl.currentelo
        }
    }

    /**
     * Returns a JSON representation of the players, for saving to players.json.
     * 
     * Filters out values which should not be saved and change between nights.
     * 
     * @param finaliseranks True if calculated ELO values should be saved, otherwise false
     * @returns JSON string representation of players.
     */
    getJSON() {
        const replacer = (key: string, value: any) => {
            if (["currentelo", "inrounds", "byes", "playingState", "seed"].includes(key)) {
                return undefined;
            }
            return value
        }
        return JSON.stringify({players: this.players}, replacer)
    }
}

export default PlayerList;