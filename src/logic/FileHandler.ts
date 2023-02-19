import { IPlayer } from './Player';
import { IWeek } from './Week';

async function getPlayerJSON(): Promise<IPlayer[] | null> {
    let jsonData: BufferSource | null = null;

    try {
        jsonData = await window.filesys.loadPlayerFile();
        console.log(jsonData);
    } catch (e) {
        if (e instanceof TypeError) {
            console.log('Error fetching JSON file');
            console.log(e.message);
        } else {
            throw e;
        }
    }

    if (jsonData != null) {
        const data: IPlayer[] = JSON.parse(new TextDecoder().decode(jsonData)).players;
        return data;
    }
    console.log('Error getting JSON');

    return null;
}

async function getBackupJSON(): Promise<IWeek | null> {
    let jsonData: BufferSource | null = null;

    try {
        jsonData = await window.filesys.loadBackup();
    } catch (e) {
        if (e instanceof TypeError) {
            console.log('Error loading backup');
            console.log(e.message);
        } else {
            throw e;
        }
    }

    if (jsonData != null) {
        const data: IWeek = JSON.parse(new TextDecoder().decode(jsonData));
        return data;
    }
    console.log('Error loading backup');

    return null;
}

export { getPlayerJSON, getBackupJSON };
