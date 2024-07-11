import Axios from "axios";
import { PublicationData } from "centrifuge";
import { config } from "node-config-ts";

export function publish (channel: string, data: PublicationData) {
    return Axios.post(`${config.centrifugo.apiUrl}/publish`, {
        channel,
        data,
    }, {
        headers: {
            "X-API-Key": config.centrifugo.apiKey,
        },
    });
}