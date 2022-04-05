import React from 'react';
import {Player, MembershipType} from "../logic/Player"
import {useLocation, useNavigate} from "react-router-dom"
import "../styles/PlayerEdit.css"

type EditPlayerBoxProps = {
    callbacks: {
        setPlayer: Function
    }
}

type EditPlayerBoxState = {
    player: Player
}

interface FormElements extends HTMLFormElement {
    playerid: HTMLInputElement;
    playername: HTMLInputElement;
    elo: HTMLInputElement;
    member: HTMLInputElement;
    paid: HTMLInputElement;
    ap3: HTMLInputElement;
}





function EditPlayerBox (props: EditPlayerBoxProps) {

    const location = useLocation() 
    var player = (location.state as EditPlayerBoxState).player;

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        var id: number;

        var elements = (event.currentTarget as FormElements)
    
        var idtxt = elements.playerid.value
        if (idtxt !== undefined) {
            id = parseInt(idtxt)
        } else {
            throw new Error("No player ID when generating player")
        }
    
        var name = elements.playername.value
        if (name === undefined) {
            name = "";
        }
    
        var startingelotxt = elements.elo.value
        var startingelo = 0;
        if (startingelotxt !== null) {
            startingelo = parseFloat(parseFloat(startingelotxt).toPrecision(5));
        }
    
        const membership = elements.member.value

        const paid = elements.paid.checked
        const ap3 = elements.ap3.checked
    
        var newPlayer = new Player(id, name, membership as MembershipType, ap3, startingelo)
        newPlayer.paid = paid
    
        props.callbacks.setPlayer(newPlayer)
        
        
    }
    
    let navigate = useNavigate();
    return (
        <div className="editplayerbox">
            <div className="editplayerleft">
                <div className="label">ID: </div>
                <div className="label">Name:</div>
                <div className="label">Starting ELO:</div>
                <div className="label">Member: </div>
                <div className="label">Paid: </div>
                <div className="label">AP3: </div>
            </div>
            <div className="editplayerleft">
                <form onSubmit={e => {onSubmit(e); navigate(-1)}}>
                    <div className="inputholder">
                        <input type="number" id="playerid" name="playerid"
                        min="0" max="99999999" defaultValue={player.id || 0} disabled/>
                    </div>
                    <div className="inputholder">
                        <input type="text" id="playername" name="playername"
                        defaultValue={player.name || ''}/>
                    </div>
                    <div className="inputholder">
                        <input type="number" id="elo" name="elo"
                        min="0" max="100" step="0.0001" defaultValue={player.startingelo || 0}/>
                    </div>
                    <div className="inputholder">
                        <select name="member" id="member">
                            <option selected={player.member === MembershipType.NONE} value="none">None</option>
                            <option selected={player.member === MembershipType.MEMBER} value="member">Member</option>
                            <option selected={player.member === MembershipType.ALUMNI} value="alumni">Alumni</option>
                        </select>
                    </div>
                    <div className="inputholder">
                        <input type="checkbox" id="paid" name="paid"
                        defaultChecked={!player.member}/>
                    </div>
                    <div className="inputholder">
                        <input type="checkbox" id="ap3" name="ap3"
                        defaultChecked={player.ap3}/>
                    </div>
                    <div className="inputholder">
                        <button type="submit" className="save-btn">Save</button>
                    </div>
                </form>
            </div>
            
        </div>
    )
}


export default EditPlayerBox;