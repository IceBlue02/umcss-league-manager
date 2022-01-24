const { ipcRenderer, contextBridge } = require('electron');

/*  Preload script before electron renderer process launches

    Exposes filesystem operations (saving and opening files) in the renderer process.
    This is a safer and more modern approach compared to the previous method of 
    "contextIsolation = false", as it purely restricts operations to only those defined
    in this API. 
*/

contextBridge.exposeInMainWorld('filesys', {
    readFile: (path: string) => ipcRenderer.invoke('readFile', path)
});