import { BanchoLobby, BanchoLobbyPlayer } from "bancho.js";

export default function areAllPlayersInAssignedSlots (mpLobby: BanchoLobby, playersPlaying: BanchoLobbyPlayer[] | undefined) {
    return !playersPlaying || playersPlaying.every(p => mpLobby.slots.some(s => s?.user.id === p.user.id));
}