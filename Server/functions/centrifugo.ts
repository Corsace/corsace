import { PublicationData } from "centrifuge";
import { config } from "node-config-ts";

export function publish (channel: string, data: PublicationData) {
    fetch(`${config.centrifugo.apiUrl}/publish`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": config.centrifugo.apiKey,
        },
        body: JSON.stringify({
            channel,
            data,
        }),
    }).catch(err => {
        console.error(`Failed to publish message to Centrifugo, channel: ${channel}`, err);
    });
}
