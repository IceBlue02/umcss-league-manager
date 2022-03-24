const { ipcRenderer, contextBridge } = require('electron');

/*  Preload script before electron renderer process launches

    Exposes filesystem operations (saving and opening files) in the renderer process.
    This is a safer and more modern approach compared to the previous method of 
    "contextIsolation = false", as it purely restricts operations to only those defined
    in this API. 
*/

contextBridge.exposeInMainWorld('filesys', {
    readFile: (path: string) => ipcRenderer.invoke('readFile', path),
    saveFile: (jsonfile: string) => ipcRenderer.invoke('saveFile', jsonfile),
    saveScoringLog: (file: string) => ipcRenderer.invoke('saveScoringlog', file),
    saveCSVFile: (file: string) => ipcRenderer.invoke('saveCSVFile', file),
    saveBackup: (jsonfile: string, filename: string) => ipcRenderer.invoke('saveBackup', jsonfile, filename),
    loadBackup: () => ipcRenderer.invoke('loadBackup'),
    savePlayerFile: (jsonfile: string) => ipcRenderer.invoke("savePlayerFile", jsonfile),
    loadPlayerFile: () => ipcRenderer.invoke('loadPlayerFile')
});