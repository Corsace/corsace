import { BanchoChannel, BanchoLobby, BanchoMessage } from "bancho.js";
import { StageType } from "../../../../Interfaces/stage";
import { Beatmap } from "../../../../Models/beatmap";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { leniencyTime } from "../../../../Models/tournaments/stage";
import getMappoolSlotMods from "./getMappoolSlotMods";

async function getNextBeatmap (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, pools: Mappool[]): Promise<[Beatmap, number | null | undefined, boolean] | null> {
    return new Promise((resolve, reject) => {
        if (matchup.stage!.stageType === StageType.Qualifiers) {
            const pool = pools[0];
            const beatmaps = pool.slots
                .flatMap(slot => slot.maps
                    .sort((a, b) => a.order - b.order)
                )
                .filter(map => !matchup.maps!
                    .some(matchMap => matchMap.map.beatmap?.ID === map.beatmap?.ID)
                );

            if (beatmaps.length === 0)
                return resolve(null);        

            if (!matchup.stage!.qualifierTeamChooseOrder || beatmaps.length === 1) {
                if (!beatmaps[0].beatmap)
                    return reject(new Error("Beatmap doesn't exist CONTACT CORSACE IMMEDIATELY"));

                const slotMod = pool.slots.find(slot => slot.maps.some(map => map.beatmap?.ID === beatmaps[0].beatmap?.ID))!;
                return resolve([beatmaps[0].beatmap, slotMod.allowedMods, typeof slotMod.allowedMods !== "number" || typeof slotMod.uniqueModCount === "number" || typeof slotMod.userModCount === "number"]);
            }
            let gotBeatmap = false;
            const messageHandler = async (message: BanchoMessage) => {
                if (message.user.ircUsername === "BanchoBot" && message.content === "Countdown finished") {
                    setTimeout(() => {
                        if (gotBeatmap)
                            return;
                        if (beatmaps.length === 0)
                            return resolve(null);
                        if (!beatmaps[0].beatmap)
                            return reject(new Error("Beatmap doesn't exist CONTACT CORSACE IMMEDIATELY"));

                        mpChannel.sendMessage("OK U GUYS ARE TAKING TOO LON g im picking a random map for all of u to play now GL");
                        const slotMod = pool.slots.find(slot => slot.maps.some(map => map.beatmap?.ID === beatmaps[0].beatmap?.ID))!;
                        mpChannel.removeListener("message", messageHandler);
                        return resolve([beatmaps[0].beatmap, slotMod.allowedMods, typeof slotMod.allowedMods !== "number" || typeof slotMod.uniqueModCount === "number" || typeof slotMod.userModCount === "number"]);
                    }, leniencyTime);
                }

                const isManagerMessage = !message.self && message.user.id && (
                    (
                        matchup.stage?.stageType === StageType.Qualifiers &&
                        matchup.teams?.some(team => team.manager.osu.userID === message.user.id.toString())
                    ) ||
                    [matchup.team1, matchup.team2].some(team => team?.manager.osu.userID === message.user.id.toString()));

                if (!isManagerMessage)
                    return;

                const contentParts = message.content.split(" ");
                const command = contentParts[0];
                const param = ["!map", "!pick"].includes(command) ? contentParts[1] : command;

                if (param.length > 4)
                    return;

                const mapById = (id: number) => beatmaps.find(map => map.beatmap!.ID === id);
                const mapBySlotOrder = (slot: MappoolSlot, order: number) => slot.maps.find(map => map.order === order);

                const id = parseInt(param);
                let map: MappoolMap | undefined;

                if (isNaN(id)) {
                    const nums = param.match(/\d+/g) || [];
                    const order = parseInt(nums[nums.length - 1]);
                    const slot = pool.slots.find(slot => param.toLowerCase().includes(slot.acronym.toLowerCase()));

                    if (!slot)
                        return;
                    if (isNaN(order) && slot.maps.length > 1)
                        return await mpChannel.sendMessage(`Slot ${slot.acronym} has more than 1 map, specify a map #`);

                    map = mapBySlotOrder(slot, isNaN(order) ? 1 : order);
                } else
                    map = mapById(id);

                if (!map)
                    return await mpChannel.sendMessage("The map ID or slot provided is INVALID .");
                if (!map.beatmap)
                    return reject(new Error("Map is missing beatmap CONTACT CORSACE IMMEDIATELY"));

                const slotMod = pool.slots.find(slot => slot.maps.some(slotMap => slotMap.beatmap!.ID === map!.beatmap!.ID))!;

                if (!beatmaps.some(beatmap => beatmap.beatmap!.ID === map!.beatmap!.ID))
                    return await mpChannel.sendMessage(`${slotMod.acronym}${map.order} is ALREADY PLAYED .`);

                gotBeatmap = true;
                mpChannel.removeListener("message", messageHandler);
                return resolve([map.beatmap, slotMod.allowedMods, typeof slotMod.allowedMods !== "number" || typeof slotMod.uniqueModCount === "number" || typeof slotMod.userModCount === "number"]);
            };

            mpChannel.sendMessage("It's time to pick a map!!11!1");
            mpLobby.startTimer(matchup.stage!.tournament.mapTimer || 90);
            mpChannel.on("message", messageHandler);
        } else {
            // TODO: implement this
            reject(new Error("Not implemented"));
        }
    });
}

export default async function loadNextBeatmap (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, pools: Mappool[], possibleEnd: boolean): Promise<boolean> {
    const nextBeatmapInfo = await getNextBeatmap(matchup, mpLobby, mpChannel, pools);
    if (!nextBeatmapInfo) {
        if (!possibleEnd)
            throw new Error("No maps found? This is probably a mistake CONTACT CORSACE IMMEDIATELY");

        return true;
    }

    const mods = getMappoolSlotMods(nextBeatmapInfo[1]);
    await Promise.all([
        mpLobby.setMap(nextBeatmapInfo[0].ID),
        mpLobby.setMods(mods, nextBeatmapInfo[2]),
    ]);
    await mpLobby.startTimer(matchup.stage!.tournament.readyTimer || 90);
    return false;
}