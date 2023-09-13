import Axios from "axios";
import { BanchoLobbyPlayer, BanchoLobbyPlayerStates } from "bancho.js";
import { PublicationData } from "centrifuge";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";

export function publish (matchup: Matchup, data: PublicationData) {
    return Axios.post(`${config.centrifugo.apiUrl}/publish`, {
        channel: `matchup:${matchup.ID}`,
        data,
    }, {
        headers: {
            "X-API-Key": config.centrifugo.apiKey,
        },
    });
}

export function publishSettings (matchup: Matchup, slots: BanchoLobbyPlayer[]) {
    return publish(matchup, { 
        type: "settings",
        slots: slots.map((slot, i) => ({
            playerOsuID: slot?.user.id,
            slot: i + 1,
            mods: slot?.mods.map(mod => mod.shortMod).join(""),
            team: slot?.team,
            ready: slot?.state === BanchoLobbyPlayerStates.Ready,
        })),
    });
}