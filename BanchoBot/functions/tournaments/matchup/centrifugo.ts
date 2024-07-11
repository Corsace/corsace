import { BanchoLobbyPlayer, BanchoLobbyPlayerStates } from "bancho.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { publish } from "../../../../Server/functions/centrifugo";

export function publishSettings (matchup: Matchup, slots: BanchoLobbyPlayer[]) {
    return publish(`matchup:${matchup.ID}`, { 
        type: "settings",
        slots: slots.map((slot, i) => ({
            playerOsuID: slot?.user.id,
            slot: i + 1,
            mods: slot?.mods.map(mod => mod.shortMod).join(""),
            team: slot?.team as "Blue" | "Red",
            ready: slot?.state === BanchoLobbyPlayerStates.Ready,
        })),
    });
}