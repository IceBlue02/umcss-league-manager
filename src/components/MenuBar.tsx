import React from 'react';
import "../styles/MenuBar.css"
import "./PlayerSelect"


import {
    HashRouter as Router,
    Route, 
    Link
} from "react-router-dom"
import { useTouchSensor } from 'react-beautiful-dnd';

type MenuBarProps = {
    callbacks: {
        generateRound: Function
        weekEnd: Function
        backupLoad: Function
    }
}

class MenuBar extends React.Component<MenuBarProps> {
    constructor(props: MenuBarProps) {
        super(props);
        this.onGenerateClick = this.onGenerateClick.bind(this);
        this.onWeekEndClick = this.onWeekEndClick.bind(this);
        this.onBackupLoadClick = this.onBackupLoadClick.bind(this);
    }

    onGenerateClick(event: React.MouseEvent): void {
        this.props.callbacks.generateRound();
    }

    onWeekEndClick(event: React.MouseEvent): void {
        this.props.callbacks.weekEnd();
    }

    onBackupLoadClick(event: React.MouseEvent): void {
        this.props.callbacks.backupLoad();
    }

    render() {
        return (
            <div className="menubar">
                <img id="logo" src={require('../img/logo.png')} alt=""/>

                <Link id="playerMenuButton"
                className="btn btn-pink"
                role="button"
                to="/players">
                    Players
                </Link>
                <button id="backupRestoreButton" onClick={this.onBackupLoadClick}>Load Backup</button>

                
                <div className="spacer"></div>
                <button id="genRoundButton" onClick={this.onGenerateClick}>Generate Next Round</button>
                <button id="finishWeekButton" onClick={this.onWeekEndClick}>Finish Week</button>
            </div>
        )
    }
}

export default MenuBar;