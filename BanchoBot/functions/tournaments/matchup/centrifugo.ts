import Axios from "axios";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";

export function publish (matchup: Matchup, data: any) {
    return Axios.post(`${config.centrifugo.apiUrl}/publish`, {
        channel: `matchup:${matchup.ID}`,
        data,
    }, {
        headers: {
            "X-API-Key": config.centrifugo.apiKey,
        },
    });
}