import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

import { HashRouter as Router } from 'react-router-dom';
import Main from './components/Main';

import PlayerList from './logic/PlayerList';
import { Week } from './logic/Week';
import { getPlayerJSON } from './logic/FileHandler';

declare global {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    interface Window {
        filesys? : any
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

function renderMain(pl: PlayerList) {
    const week = new Week(pl);

    const container = document.getElementById('root');
    if (container !== null) {
        const root = createRoot(container);

        root.render(
            <React.StrictMode>
                <Router>
                    <Main inweek={week} />
                </Router>
            </React.StrictMode>,
        );
    } else {
        console.log('Error: Root container is undefined.');
    }
}

getPlayerJSON()
    .then((jsonData) => {
        if (jsonData !== null) {
            return new PlayerList(jsonData);
        }
        throw new Error('Something went wrong when generating the player list');
    })
    .then((pl) => renderMain(pl));
