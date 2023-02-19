import React from 'react';
import {Player, MembershipType, PlayingState} from "../logic/Player"

import {Draggable} from "@hello-pangea/dnd"

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
        if (this.props.player.ap3) {
            tags.push(<div key={this.props.player.id.toString() + '-ap3'} className="tag ap3-tag">AP3</div>)
        }
        switch (this.props.player.member) {
            case (MembershipType.NONE):
                if (this.props.player.paid) {
                    tags.push(<div key={this.props.player.id.toString() + '-membertag'} className="tag paid-tag">£</div>)
                } else {
                    tags.push(<div key={this.props.player.id.toString() + '-membertag'} className="tag not-paid-tag">£</div>)
                }
            break;
            case (MembershipType.MEMBER):
                tags.push(<div key={this.props.player.id.toString() + '-membertag'} className="tag member-tag">M</div>)
            break;
            case (MembershipType.ALUMNI):
                tags.push(<div key={this.props.player.id.toString() + '-membertag'} className="tag alumni-tag">A</div>)
            break;
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
                    <div className="pl-card" onMouseDown={this.onMouseDown} ref={provided.innerRef} 
                    key={this.props.player.id.toString() + '-card'} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <div key={this.props.player.id.toString() + '-name'} className="pl-name">{this.props.player.name}</div>
                        {this.getTags()}
                        <div key={this.props.player.id.toString() + '-spacer'} className="spacer"></div>
                        <div key={this.props.player.id.toString() + '-elo'} className="pl-elo">{Math.round((this.props.player.startingelo + Number.EPSILON) * 10000) / 10000}</div>
                    </div>
                )}
            </Draggable>
            
        )
    }
}

export default PlayerCard;