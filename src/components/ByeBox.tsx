import { Player } from '../logic/Player';

function ByeBox(props: { player: Player }) {
    return (
        <div className="byebox gridbox">
            <div className="byebox-inside">
                <span className="byebox-label">Bye: </span>
                <span className="byebox-player">
                    {' '}
                    {props.player.name}
                </span>
            </div>
        </div>
    );
}

export default ByeBox;
