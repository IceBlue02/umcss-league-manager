
interface IPlayer {
    id: number;
    name: string;
    startingelo: number;
}

class Player {
    id: number;
    name: string;
    startingelo: number;
    currentelo: number;
    inrounds: boolean[];
    byes: (boolean | null)[];
    active: boolean = true;

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

    static fromJSON(jsonObj: IPlayer, currentround?: number): Player {
        if (typeof(currentround) != undefined) {
            return new Player(jsonObj.id, jsonObj.name, jsonObj.startingelo, currentround);
        } else {
            return new Player(jsonObj.id, jsonObj.name, jsonObj.startingelo);
        }
    }
}

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

    getPlayers(): Player[] {
        return this.players;
    }

    getPlayerFromID(id: number): Player {
        for (const pl of this.players) {
            if (pl.id === id) {
                return pl;
            }
        }
        throw new Error(`Player ${id} not found`);
    }

    getPlayerFromName(name: string): Player | null {
        for (const pl of this.players) {
            if (pl.name.toLowerCase().includes(name.toLowerCase())) {
                return pl;
            }
        }
        return null;
    }
}

export {Player, PlayerList}
export type {IPlayer}