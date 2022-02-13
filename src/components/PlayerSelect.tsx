import React from 'react';
import PlayerList from "../logic/PlayerList";
import {PlayingState} from "../logic/Player"
import {Link, Navigate} from "react-router-dom"
import {DragDropContext, Droppable, Draggable, DropResult} from "react-beautiful-dnd"

import PlayerCard from "./PlayerCard"

import "../styles/PlayerSelect.css"



declare global {
    interface Window {
        filesys? : any
    }
}

type PlayerSelectState = {
    order: PlayerOrders
    editPlayer: number | null
}

type PlayerOrders = {
    playing: number[]
    notplaying: number[]
    away: number[]
}

type PlayerSelectProps = {
    players: PlayerList
    callbacks: {
        playerStateChanged: Function;
    }
}


class PlayerSelect extends React.Component<PlayerSelectProps, PlayerSelectState> {
    
    constructor(props: PlayerSelectProps) {
        super(props)
        this.state = {
            editPlayer: null,
            order: this.initOrder()
        }
        this.onDragEnd = this.onDragEnd.bind(this);
        this.editPlayerClick = this.editPlayerClick.bind(this);
    }

    initOrder(): PlayerOrders {
        var order: PlayerOrders = {
            playing: [],
            notplaying: [],
            away: []
        }

        for (const pl of this.props.players.getPlayers()) {
            switch(pl.playingState) {
                case (PlayingState.PLAYING):
                    order.playing.push(pl.id);
                    break;
                case (PlayingState.NOTPLAYING):
                    order.notplaying.push(pl.id);
                    break;
                case (PlayingState.AWAY):
                    order.away.push(pl.id);
                    break;
            }
        }

        return order;
    }

    setNewOrder(plid: number, newIndx: number, dropID: string) {

        function addAfter<T>(array: T[], index: number, newItem: T): T[] {
            return [
                ...array.slice(0, index),
                newItem,
                ...array.slice(index)
            ];
        }

        var newOrder = this.state.order;
        newOrder = { // Removes the id from whichever list it started in
            playing: newOrder.playing.filter(p => p !== plid),
            notplaying: newOrder.notplaying.filter(p => p !== plid),
            away: newOrder.away.filter(p => p !== plid)
        }

        switch(dropID) {
            case ("playing"):
                newOrder.playing = addAfter(newOrder.playing, newIndx, plid)
                break;
            case ("not-playing"):
                newOrder.notplaying = addAfter(newOrder.notplaying, newIndx, plid)
                break;
            case ("away"):
                newOrder.away = addAfter(newOrder.away, newIndx, plid)
                break;
        }

        this.setState({order: newOrder})

    }

    onDragEnd(result: DropResult) {
        const plid = parseInt(result.draggableId);
        if (!result.destination) {
            return
        }

        if (result.destination.droppableId === "playing") {
            this.props.callbacks.playerStateChanged(result.draggableId, PlayingState.PLAYING);
        } else if (result.destination.droppableId === "not-playing") {
            this.props.callbacks.playerStateChanged(result.draggableId, PlayingState.NOTPLAYING);
        } else if (result.destination.droppableId === "away") {
            this.props.callbacks.playerStateChanged(result.draggableId, PlayingState.AWAY);
        }
        this.setNewOrder(parseInt(result.draggableId), result.destination.index, result.destination.droppableId)
    }

    editPlayerClick(playerId: number) {
        this.setState({editPlayer: playerId, order: this.state.order})
    }

    renderPlayersWithState(state: PlayingState) {
        var rows = [];
        var i = 0;
        
        switch(state) {
            case (PlayingState.PLAYING):
                for (const plid of this.state.order.playing) {
                    rows.push (
                        <PlayerCard onEdit={this.editPlayerClick} player={this.props.players.getPlayerFromID(plid)} index={i}/>
                    )
                    i++;
                }
                break;
            case (PlayingState.NOTPLAYING):
                for (const plid of this.state.order.notplaying) {
                    rows.push (
                        <PlayerCard onEdit={this.editPlayerClick} player={this.props.players.getPlayerFromID(plid)} index={i}/>
                    )
                    i++;
                }
                break;
            case (PlayingState.AWAY):
                for (const plid of this.state.order.away) {
                    rows.push (
                        <PlayerCard onEdit={this.editPlayerClick} player={this.props.players.getPlayerFromID(plid)} index={i}/>
                    )
                    i++;
                }
                break;
        }

        
        return rows
    }

    render() {
        if (this.state.editPlayer) {
            const pl = this.props.players.getPlayerFromID(this.state.editPlayer);
            this.setState(prevState => ({editPlayer: null, order: prevState.order}));
            return <Navigate to="/editplayer" state={{player: pl}}></Navigate>
        }

        return (
            <div>
                <div className="row">
                    <Link id="back-btn" className="btn btn-pink" role="button" to="/">Back</Link>
                    <div className="title">Players</div>  
                    <div className="row-spacer"></div>
                </div>
                <div className="column-titles">
                    <div className="col-title">Away</div>
                    <div className="col-title">Active</div>
                    <div className="col-title">Inactive</div>
                </div>
                <div className="column-holder">
                    <DragDropContext onDragEnd={this.onDragEnd}> 
                        <Droppable droppableId="away">
                            {(provided) => (
                                <div className="pl-col" {...provided.droppableProps} id="away-col" ref={provided.innerRef}>
                                    {this.renderPlayersWithState(PlayingState.AWAY)}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        <Droppable droppableId="playing">
                            {(provided) => (
                                <div className="pl-col" {...provided.droppableProps} id="playing-col" ref={provided.innerRef}>
                                    {this.renderPlayersWithState(PlayingState.PLAYING)}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        
                        <Droppable droppableId="not-playing">
                            {(provided) => (
                                <div className="pl-col" {...provided.droppableProps} id="not-playing-col" ref={provided.innerRef}>
                                    {this.renderPlayersWithState(PlayingState.NOTPLAYING)}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
                <div className="bottom-row">
                    <Link id="new-pl-btn" className="btn btn-pink" role="button" to="/editplayer" state={{player: this.props.players.getNewPlayer()}}>New Player</Link>
                </div>
            </div>
            
        )
    }
}

export default PlayerSelect;

