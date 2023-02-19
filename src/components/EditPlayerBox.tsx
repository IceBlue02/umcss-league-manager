import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Player, MembershipType } from '../logic/Player';
import '../styles/PlayerEdit.css';

type EditPlayerBoxProps = {
    callbacks: {
        setPlayer: Function
    }
};

type EditPlayerBoxState = {
    player: Player
};

interface FormElements extends HTMLFormElement {
    playerid: HTMLInputElement;
    playername: HTMLInputElement;
    elo: HTMLInputElement;
    member: HTMLInputElement;
    paid: HTMLInputElement;
    ap3: HTMLInputElement;
    played: HTMLInputElement;
    wins: HTMLInputElement;
    gsb: HTMLInputElement;
}

function EditPlayerBox(props: EditPlayerBoxProps) {
    const location = useLocation();
    const { player } = location.state as EditPlayerBoxState;

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let id: number;

        const elements = (event.currentTarget as FormElements);

        const idtxt = elements.playerid.value;
        if (idtxt !== undefined) {
            id = parseInt(idtxt);
        } else {
            throw new Error('No player ID when generating player');
        }

        let name = elements.playername.value;
        if (name === undefined) {
            name = '';
        }

        const startingelotxt = elements.elo.value;
        let startingelo = 0;
        if (startingelotxt !== null) {
            startingelo = parseFloat(parseFloat(startingelotxt).toPrecision(5));
        }

        const membership = elements.member.value;
        const paid = elements.paid.checked;
        const ap3 = elements.ap3.checked;

        const playedtext = elements.played.value;
        let played = 0;
        if (playedtext !== null) {
            played = parseInt(playedtext);
        }

        const winstext = elements.wins.value;
        let wins = 0;
        if (winstext !== null) {
            wins = parseInt(winstext);
        }

        const gsbtext = elements.gsb.value;
        let gsb = 0;
        if (gsbtext !== null) {
            gsb = parseInt(gsbtext);
        }

        const newPlayer = new Player(id, name, membership as MembershipType, ap3, startingelo, played, gsb, wins);
        newPlayer.paid = paid;

        props.callbacks.setPlayer(newPlayer);
    };

    const navigate = useNavigate();
    return (
        <div className="editplayerbox">
            <div className="editplayerleft">
                <div className="label">ID: </div>
                <div className="label">Name:</div>
                <div className="label">Starting ELO:</div>
                <div className="label">Member: </div>
                <div className="label">Paid: </div>
                <div className="label">AP3: </div>
                <div className="label">Played: </div>
                <div className="label">Wins: </div>
                <div className="label">Games since bye: </div>
            </div>
            <div className="editplayerleft">
                <form onSubmit={(e) => { onSubmit(e); navigate(-1); }}>
                    <div className="inputholder">
                        <input
                            type="number"
                            id="playerid"
                            name="playerid"
                            min="0"
                            max="99999999"
                            defaultValue={player.id || 0}
                            disabled
                        />
                    </div>
                    <div className="inputholder">
                        <input
                            type="text"
                            id="playername"
                            name="playername"
                            defaultValue={player.name || ''}
                        />
                    </div>
                    <div className="inputholder">
                        <input
                            type="number"
                            id="elo"
                            name="elo"
                            min="0"
                            max="100"
                            step="0.0001"
                            defaultValue={player.startingelo || 0}
                        />
                    </div>
                    <div className="inputholder">
                        <select name="member" id="member">
                            <option selected={player.member === MembershipType.NONE} value="none">None</option>
                            <option selected={player.member === MembershipType.MEMBER} value="member">Member</option>
                            <option selected={player.member === MembershipType.ALUMNI} value="alumni">Alumni</option>
                        </select>
                    </div>
                    <div className="inputholder">
                        <input
                            type="checkbox"
                            id="paid"
                            name="paid"
                            defaultChecked={!player.member}
                        />
                    </div>
                    <div className="inputholder">
                        <input
                            type="checkbox"
                            id="ap3"
                            name="ap3"
                            defaultChecked={player.ap3}
                        />
                    </div>
                    <div className="inputholder">
                        <input
                            type="number"
                            id="played"
                            name="played"
                            className="int-input"
                            min="0"
                            step="1"
                            defaultValue={player.played || 0}
                        />
                    </div>
                    <div className="inputholder">
                        <input
                            type="number"
                            id="wins"
                            name="wins"
                            className="int-input"
                            min="0"
                            step="1"
                            defaultValue={player.wins || 0}
                        />
                    </div>
                    <div className="inputholder">
                        <input
                            type="number"
                            id="gsb"
                            name="gsb"
                            className="int-input"
                            min="0"
                            step="1"
                            defaultValue={player.gamessincebye || 0}
                        />
                    </div>
                    <div className="inputholder">
                        <button type="submit" className="save-btn">Save</button>
                    </div>
                </form>
            </div>

        </div>
    );
}

export default EditPlayerBox;
