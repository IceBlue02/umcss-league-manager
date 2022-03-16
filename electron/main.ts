import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";

var fs = require('fs');
const path = require('path');

let win: BrowserWindow;
function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      // contextIsolation: false,
      preload: path.join(__dirname, 'preload.js') // For context bridge to renderer
    }
  })

  if (app.isPackaged) {
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  } else {
    win.loadURL('http://localhost:3000/index.html');

    win.webContents.openDevTools();
    // Hot Reloading on 'node_modules/.bin/electronPath'
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname,
        '..',
        '..',
        'node_modules',
        '.bin',
        'electron' + (process.platform === "win32" ? ".cmd" : "")),
      forceHardReset: true,
      hardResetMethod: 'exit'
    });
  }
}

ipcMain.handle("readFile", (event, filepath: string) => {
    var res = fs.readFileSync(filepath);
    return res;
})

ipcMain.handle("saveFile", (event, jsonstring: string) => {
    const filepath = dialog.showSaveDialogSync(win, {
        title: "Save Datafile",
        defaultPath: app.getPath("documents"),
        filters: [{name: "JSON Data", extensions: ["json"]}]
    })

    if (filepath !== undefined) {
        fs.writeFileSync(filepath, jsonstring)
    }
})

ipcMain.handle("saveScoringlog", (event, file: string) => {
    const filepath = dialog.showSaveDialogSync(win, {
        title: "Save Scoring Log",
        defaultPath: app.getPath("documents"),
        filters: [{name: "Text", extensions: ["txt"]}]
    })

    if (filepath !== undefined) {
        fs.writeFileSync(filepath, file)
    }
})

ipcMain.handle("saveCSVFile", (event, file: string) => {
    const filepath = dialog.showSaveDialogSync(win, {
        title: "Save Rankings",
        defaultPath: app.getPath("documents"),
        filters: [{name: "CSV Data", extensions: ["csv"]}]
    })

    if (filepath !== undefined) {
        fs.writeFileSync(filepath, file)
    }
})

ipcMain.handle("saveBackup", (event, jsonstring, filename?: string) => {
    let filepath;
    if (filename !== undefined) {
        filepath = path.join(app.getPath("userData"), "backups", "backup.json")
    } else {
        filepath = path.join(app.getPath("userData"), "backups", filename)
    }
    console.log(filepath);

    try {
        fs.writeFileSync(filepath, jsonstring);
    } catch (err: any) {
        if (err.code === "ENOENT") { 
            fs.mkdirSync(path.join(app.getPath("userData"), "backups"), { recursive: true });
            fs.writeFileSync(filepath, jsonstring);
        }
    }
})

ipcMain.handle("loadBackup", (event) => {
    const filepath = dialog.showOpenDialogSync(win, {
        title: "Load Backup",
        defaultPath: path.join(app.getPath("userData"), "backups"),
        filters: [{name: "JSON Data", extensions: ["json"]}]
    })

    if (filepath !== undefined) {
        return fs.readFileSync(filepath[0])
    } else {
        return null
    }

})

ipcMain.handle("loadPlayerFile", (event) => {
    var filepath = path.join(app.getPath("userData"), "players.json");

    try {
        var res = fs.readFileSync(filepath);
        return res;

    } catch (err: any) {
        if (err.code === "ENOENT") {
            let filepatharr = dialog.showOpenDialogSync(win, {
                title: "Please open players.json to import player data",
                defaultPath: app.getPath("home"),
                filters: [{name: "JSON Data", extensions: ["json"]}]}
            )

            if (filepatharr !== undefined) {
                var res = fs.readFileSync(filepatharr[0]);
            } else {
                throw err;
            }
            
            return res;
        }

    }
})


ipcMain.handle("savePlayerFile", (event, jsonstring: string) => {
    const filepath = path.join(app.getPath("userData"), "players.json");
    fs.writeFileSync(filepath, jsonstring)
})

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
});

/*app.whenReady().then(() => {
  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      //win.webContents.openDevTools();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});*/