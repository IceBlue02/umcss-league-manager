import React from 'react';
import {Player} from "../logic/Player"

import {Draggable} from "react-beautiful-dnd"

import "../styles/PlayerCard.css"



type PlayerCardProps = {
    player: Player;
    index: number;
    onEdit: Function;
}

class PlayerCard extends React.Component<PlayerCardProps> {
    constructor(props: PlayerCardProps) {
        super(props)
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    getTags() {
        var tags = [];
        if (this.props.player.member) {
            tags.push(<div className="tag member-tag">M</div>)
            if (this.props.player.ap3) {
                tags.push(<div className="tag ap3-tag">AP3</div>)
            }
        } else {
            tags.push(<div className="tag not-paid-tag">£</div>)
        }

        return tags;
    }

    onMouseDown(event: React.MouseEvent) {
        if (event.button === 2) {
            this.props.onEdit(this.props.player.id);
        }
        if (event.detail == 3) {
            event.stopPropagation();
        }
    }

    render() {
        

        return (
            <Draggable key={this.props.player.id} draggableId={this.props.player.id.toString()} index={this.props.index}>
                {(provided) => (
                    <div className="pl-card" onMouseDown={this.onMouseDown} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <div className="pl-name">{this.props.player.name}</div>
                        {this.getTags()}
                        <div className="spacer"></div>
                        <div className="pl-elo">{this.props.player.startingelo}</div>
                    </div>
                )}
            </Draggable>
            
        )
    }
}

export default PlayerCard;