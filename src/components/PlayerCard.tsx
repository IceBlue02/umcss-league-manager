import React from 'react';
import {Player, MembershipType, PlayingState} from "../logic/Player"

import {Draggable} from "react-beautiful-dnd"

import "../styles/PlayerCard.css"



type PlayerCardProps = {
    player: Player;
    index: number;
    onEdit: Function;
    onPlayingStateChange: Function;
}

class PlayerCard extends React.Component<PlayerCardProps> {
    constructor(props: PlayerCardProps) {
        super(props)
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    getTags() {
        var tags = [];
        switch (this.props.player.member) {
            case (MembershipType.NONE):
                if (this.props.player.paid) {
                    tags.push(<div className="tag paid-tag">£</div>)
                } else {
                    tags.push(<div className="tag not-paid-tag">£</div>)
                }
            break;
            case (MembershipType.MEMBER):
                tags.push(<div className="tag member-tag">M</div>)
            break;
            case (MembershipType.ALUMNI):
                tags.push(<div className="tag alumni-tag">A</div>)
            break;
        }
        if (this.props.player.ap3) {
            tags.push(<div className="tag ap3-tag">AP3</div>)
        }
        return tags;
    }

    onMouseDown(event: React.MouseEvent) {
        if (event.button === 2) {
            this.props.onEdit(this.props.player.id);
        }
        if (event.detail === 2) {
            if (this.props.player.playingState === PlayingState.PLAYING) {
                // Double click to move
            } else if (this.props.player.playingState === PlayingState.NOTPLAYING) {
            }
        }
        if (event.detail === 3) {
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
                        <div className="pl-elo">{Math.round((this.props.player.startingelo + Number.EPSILON) * 10000) / 10000}</div>
                    </div>
                )}
            </Draggable>
            
        )
    }
}

export default PlayerCard;