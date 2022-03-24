import {IPlayer, Player, PlayingState, MembershipType} from "./Player";

/**
 * Holds all players currently known to the application
 */
class PlayerList {
    players: Player[];
    

    // TODO- Look at this
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
     * Returns the player at a given index in the players array.
     * 
     * @param index - Index of the player to return
     * @returns Player correstponding to index
     */
    getPlayerFromIndex(indx: number): Player {
        return this.players[indx];
    }

    getNewPlayer(): Player {
        var id = -1;
        while (id === -1 || this.isIDAssigned(id)) {
            id = Math.floor(Math.random() * 99999999);
        }
        return new Player(id, "", MembershipType.NONE, false, 0);
    }

    isIDAssigned(id: number) {
        for (const pl of this.players) {
            if (pl.id == id) {
                return true;
            }
        }
        return false;
    }
    
    getIndexFromID(id: number): number {
        var indx = 0;
        for (const pl of this.players) {
            if (pl.id == id) {
                return indx;
            }
            indx++;
        }
        throw new Error("Player ${id} not found");
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
     * byes: True if the player is active and is assigned a bye, False if they are active
     * and not assigned a bye, or null if they are not active.
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
                pl.inrounds.push(false);
                pl.byes.push(null);
            } else {
                pl.inrounds.push(true);
                if (typeof byeID != undefined) {
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

    getJSON(finaliseranks?: boolean) {
        if (finaliseranks) {
            for (var pl of this.players) {
                pl.startingelo = pl.currentelo
            }
        }
        const replacer = (key: string, value: any) => {
            if (["currentelo", "inrounds", "byes", "playingState"].includes(key)) {
                return undefined;
            }
            return value
        }
        return JSON.stringify({players: this.players}, replacer)
    }
}

export default PlayerList;