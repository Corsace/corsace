import { PublicationData } from "centrifuge";
import { config } from "node-config-ts";
import { post } from "../utils/fetch";

export function publish (channel: string, data: PublicationData) {
    post(`${config.centrifugo.apiUrl}/publish`, {
        channel,
        data,
    },
    {
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": config.centrifugo.apiKey,
        },
    }).catch(err => {
        console.error(`Failed to publish message to Centrifugo, channel: ${channel}`, err);
    });
}
