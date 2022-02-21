import {IPlayer} from './Player';
import {IWeek} from "./Week";

async function getPlayerJSON(filepath: string): Promise<IPlayer[] | null> {
    var jsonData: BufferSource | null = null;

    try {
        jsonData = await window.filesys.loadPlayerFile();
        console.log(jsonData);
    } 
    catch (e) {
        if (e instanceof TypeError) {
            console.log("Error fetching JSON file: " + filepath);
            console.log(e.message);
        } else {
            throw e
        }
    }

    if (jsonData != null) {
        var data: IPlayer[] = JSON.parse(new TextDecoder().decode(jsonData)).players;
        return data
    } else {
        console.log("Error getting JSON")
    }

    return null
} 

async function getBackupJSON(): Promise<IWeek | null> {
    var jsonData: BufferSource | null = null;

    try {
        jsonData = await window.filesys.loadBackup();
    } 
    catch (e) {
        if (e instanceof TypeError) {
            console.log("Error loading backup");
            console.log(e.message);
        } else {
            throw e
        }
    }

    if (jsonData != null) {
        var data: IWeek = JSON.parse(new TextDecoder().decode(jsonData));
        return data
    } else {
        console.log("Error loading backup")
    }

    return null
}

export {getPlayerJSON, getBackupJSON}