import { config } from "node-config-ts";
import { GuildMember, Message, TextChannel, User } from "discord.js";
import { discordClient, getMember } from "../../Server/discord";
import { getPoolData } from "../../Server/sheets";
import { roundAcronyms, roundNames } from "../../Interfaces/rounds";
import timeSince from "../../Server/utils/timeSince";
import { genericPoolMods } from "../../Interfaces/mods";

const openAcronyms = ["co", "open", "corsaceopen", "corsace open", "corsace"];
const closedAcronyms = ["cc", "closed", "corsaceclosed", "corsace closed"];
const acronyms = {
    openMappool: ["RR", "RO", "KO1", "KO2"],
    closedMappool: ["QL", "RO16", "QF", "SF", "F", "GF"],
};
const pools: ("openMappool" | "closedMappool")[] = ["openMappool", "closedMappool"];

const hours12 = 43200000;
const days3 = 259200000;

function poolCheck (m: Message) {
    if (Object.values(config.discord.closedMappool).some(v => v === m.channel.id))
        return "closedMappool";
    return "openMappool";
}

function identifierToPool (identifier: string): "openMappool" | "closedMappool" | undefined {
    if (openAcronyms.some(a => a === identifier.toLowerCase()))
        return "openMappool";
    if (closedAcronyms.some(a => a === identifier.toLowerCase()))
        return "closedMappool";
    return undefined;
}

async function pingChannel (pool: "openMappool" | "closedMappool") {
    if (pool === "openMappool")
        return (await discordClient.channels.fetch(config.discord.openMappool.general)) as TextChannel;
    if (pool === "closedMappool")
        return (await discordClient.channels.fetch(config.discord.closedMappool.general)) as TextChannel;
}

async function roleChecks (member: GuildMember, mappers: boolean, testplayers: boolean): Promise <boolean> {
    // Corsace head staff bypass role check
    if (
        !member.roles.cache.has(config.discord.roles.corsace.corsace) &&
        !member.roles.cache.has(config.discord.roles.corsace.core) &&
        !config.discord.roles.corsace.headStaff.some(r => member.roles.cache.has(r))
    ) {
        if (mappers && (
            config.discord.roles.open.mapper.some(r => member.roles.cache.has(r)) ||
            config.discord.roles.closed.mapper.some(r => member.roles.cache.has(r))
        ))
            return true;

        if (testplayers && (
            member.roles.cache.has(config.discord.roles.open.testplayer) ||
            member.roles.cache.has(config.discord.roles.closed.testplayer)
        ))
            return true;
        return false;
    }

    return true;
}

async function privilegeChecks (m: Message, mappers: boolean, testplayers: boolean, updateOnly = false): Promise<boolean> {
    if (
        !m.guild || 
        m.guild.id !== config.discord.guild
    ) {
        m.channel.send("You can only do this in the corsace discord server. (Please do not use this in outside of mappool/secured channels!)");
        return false;
    }

    // Check if this is in a whitelisted channel
    if (
        m.channel.id !== config.discord.headChannel &&
        m.channel.id !== config.discord.coreChannel &&
        !Object.values(config.discord.openMappool).some(v => v === m.channel.id) &&
        !Object.values(config.discord.closedMappool).some(v => v === m.channel.id)
    ) {
        m.channel.send("You can only do this in mappool/secured channels");
        return false;
    }

    if (updateOnly && m.channel.id !== config.discord.openMappool.update && m.channel.id !== config.discord.closedMappool.update) {
        m.channel.send("You can only do this in an update channel");
        return false;
    }

    const member = await getMember(m.author.id);
    if (!member) {
        m.channel.send("Unable to obtain your role perms from the Corsace server");
        return false;
    }

    // Check if the user has the required role(s).
    const roleCheck = await roleChecks(member, mappers, testplayers);

    if (!roleCheck)
        m.channel.send("You do not have the perms to use this command");

    return roleCheck;
}

async function parseParams (m: Message) {
    let pool: "openMappool" | "closedMappool" = poolCheck(m);
    let user = await getMember(m.author.id) as GuildMember;
    let round = "";
    let slot = "";
    let deadlineType: "preview" | "map" | "" = "";
    let link = "";
    let diffName = "";

    let msgContent = m.content.toLowerCase();
    let parts = msgContent.split(" ");
    
    // Find other params
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim().toLowerCase();
        const translation = identifierToPool(part);
        let used = true;
        if (translation)
            pool = translation;
        else if (roundNames.some(name => name === part))
            round = roundAcronyms[roundNames.findIndex(name => name === part)];
        else if (roundAcronyms.some(name => name === part))
            round = part;
        else if (part === "preview" || part === "map")
            deadlineType = part;
        else if (part === "-diff" && i < parts.length - 1) {
            diffName = parts[i + 1]; 
            i++;
        }
        else if (genericPoolMods.some(poolMod => part.includes(poolMod.toLowerCase())))
            slot = part;
        else
            used = false;

        if (used)
            msgContent = msgContent.replace(part, "");
    }

    // Check for mention
    parts = msgContent.split(" ");
    if (m.mentions.members && m.mentions.members.first()) {
        user = m.mentions.members.first() as GuildMember;
    } else {
        for (const part of parts) {
            const members = await m.guild!.members.fetch({ query: part });
            const member = members.first();
            if (member && await roleChecks(member, true, true)) {
                user = member;
                break;
            }
        }
    }

    // See if there's an attachment
    if (m.attachments.first()?.url.includes("osz"))
        link = m.attachments.first()!.url as string;

    // For Corsace winner finals is just finals
    if (round === "wf")
        round = "f";

    return {
        pool,
        user,
        round,
        slot,
        deadlineType,
        diffName,
        link,
    };
}

async function checkTimers () {
    for (const pool of pools) {
        const channel = (await pingChannel(pool)) as TextChannel;
        for (const round of acronyms[pool]) {
            const rows = await getPoolData(pool, round);
            if (!rows)
                continue;
            for (const row of rows) {
                if (row.length < 16 || (row[12] === "" && row[13] === ""))
                    continue;
                try {
                    const user = await discordClient.users.fetch(row[15]);
                    if (row[12] !== "")
                        deadlineParse(row, 12, round, user, channel, "preview");
                    if (row[13] !== "")
                        deadlineParse(row, 13, round, user, channel, "completed beatmap");
                } catch (e) {
                    if (e) {
                        console.error(e);
                        const head = (await discordClient.channels.fetch(config.discord.headChannel)) as TextChannel;
                        head.send("COULD NOT SEND AUTOMATED PING REMINDER MESSAGE:\n```\n" + (e as Error).toString() + "\n```");
                    }
                }
            }
        }
    }
}

function deadlineParse (row: any[], i: number, round: string, user: User, channel: TextChannel, deadlineType: "completed beatmap" | "preview") {
    const now = new Date;
    const deadline = new Date(row[i]);
    if (isNaN(deadline.getTime())) {
        channel.send(`${user.toString()} Please let the schedule/deadline head or VINXIS know that the ${deadlineType} deadline for **${round} ${row[0]}** is broken (${row[i]}).`);
        return;
    }
    const difference = deadline.getTime() - now.getTime();
    if (difference < days3 && deadline.getTime() > now.getTime())
        channel.send(`${user.toString()} You have **${timeSince(deadline, now, true)}**left to submit your ${deadlineType} for **${round} ${row[0]} (${row[i]})**`);
}

async function sheetTimer () {
    await checkTimers();
    setInterval(checkTimers, hours12);
}

export default {
    acronyms,
    pools,
    poolCheck,
    identifierToPool,
    privilegeChecks,
    parseParams,
    sheetTimer,
};