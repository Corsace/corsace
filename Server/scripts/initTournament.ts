import { exit, stdin, stdout } from "process";
import { Tournament, TournamentStatus } from "../../Models/tournaments/tournament";
import select from "@inquirer/select";
import checkbox from "@inquirer/checkbox";
import ormConfig from "../../ormconfig";
import { sleep } from "../utils/sleep";
import { discordStringTimestamp } from "../utils/dateParse";
import { config } from "node-config-ts";
import { ModeDivision } from "../../Models/MCA_AYIM/modeDivision";
import { createInterface } from "readline";
import { Stage } from "../../Models/tournaments/stage";
import { DiscordOAuth, User } from "../../Models/user";
import getUser from "../functions/get/getUser";
import { discordClient, discordGuild } from "../discord";
import { ScoringMethod, StageType } from "../../Interfaces/stage";
import { Round } from "../../Models/tournaments/round";
import { getTournamentChannelTypeRoles, TournamentChannelType, TournamentRoleType } from "../../Interfaces/tournament";
import { TournamentRole } from "../../Models/tournaments/tournamentRole";
import { ChannelType, GuildChannelCreateOptions, PermissionFlagsBits } from "discord.js";
import { TournamentChannel } from "../../Models/tournaments/tournamentChannel";
import { EmbedBuilder } from "../../DiscordBot/functions/embedBuilder";
import { Mappool } from "../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../Models/tournaments/mappools/mappoolSlot";
import { MappoolMap } from "../../Models/tournaments/mappools/mappoolMap";
import { Team } from "../../Models/tournaments/team";
import { Matchup } from "../../Models/tournaments/matchup";

const createSlot = (
    name: string,
    acronym: string,
    mapCount: number,
    createdBy: User,
    allowedMods?: number,
    userModCount?: number,
    uniqueModCount?: number
) => {
    const slot = new MappoolSlot();
    slot.createdBy = createdBy;
    slot.name = name;
    slot.acronym = acronym;
    slot.maps = [];
    for (let j = 0; j < mapCount; j++) {
        const map = new MappoolMap();
        map.createdBy = createdBy;
        map.order = j + 1;
        slot.maps.push(map);
    }
    slot.allowedMods = allowedMods;
    if (userModCount !== 0) slot.userModCount = userModCount;
    if (uniqueModCount !== 0) slot.uniqueModCount = uniqueModCount;
    return slot;
};

const getInfo = async (question: string) => {
    return new Promise<string>(resolve => {
        const rl = createInterface(stdin, stdout);
        rl.question(question, (result: string) => {
            rl.close();
            resolve(result);
        });
    });
};

ormConfig.initialize().then(async () => {
    const currTournaments = await Tournament.find();
    if (currTournaments.length > 0) {
        console.log("\x1b[41;1mTournaments already initialized\x1b[0m");
        exit(0);
    }

    console.log("\x1b[43;1mWARNING: This script is for development purposes only.\x1b[0m\nThis will create a new 1v1 standard tournament in registration phase with the specified level of infrastructure complexity.\nScript will start in 5 seconds.");
    await sleep(5000);

    const res: "base" | "discord" | "mappools" | "teams" | "matches" = await select({
        message: "Select which level of tournament creation you want to initialize",
        choices: [
            { name: "Base tournament creation", value: "base", description: "1v1 standard test tournament with a qualifier stage, and a single elimination stage (no matches)" },
            { name: "w/ Roles + Channels", value: "discord", description: "Base tournament creation + discord roles and channels" },
            { name: "w/ Mappools", value: "mappools", description: "Base tournament creation + discord roles and channels + mappools" },
            { name: "w/ Teams", value: "teams", description: "Base tournament creation + discord roles and channels + mappools + a team" },
            { name: "w/ Matches", value: "matches", description: "Base tournament creation + discord roles and channels + mappools + a team + a match containing the same team in both sides" },
        ],
    });

    console.log("Creating tournament...");

    // Base tournament
    const tournament = new Tournament();
    tournament.name = "Test";
    tournament.abbreviation = "TT";
    tournament.description = "This is a test tournament";
    tournament.server = config.discord.guild;
    tournament.stages = [];
    tournament.channels = [];
    tournament.roles = [];
    tournament.status = TournamentStatus.Registrations;
    tournament.mode = (await ModeDivision.modeSelect("osu"))!;
    tournament.matchupSize = 1;
    tournament.minTeamSize = 1;
    tournament.maxTeamSize = 1;
    tournament.regSortOrder = 0;

    const currDate = new Date();
    tournament.year = currDate.getUTCFullYear();
    tournament.registrations = {
        start: currDate,
        end: new Date(currDate.getTime() + 1000 * 60 * 60 * 24 * 30),
    };

    const openOrNormal = await select({
        message: "Should this tournament be treated as a Corsace Open tournament, or a normal tournament?\n(Only difference is a Corsace Open tournament will show up on the open site)",
        choices: [
            { name: "Normal", value: "normal", description: "Normal tournament" },
            { name: "Open", value: "open", description: "Open tournament" },
        ],
    });
    tournament.isOpen = openOrNormal !== "normal";

    // Get organizer user
    const discordID = await getInfo("Enter your discord user ID to be assigned as tournament organizer (Example: 123456789012345678): ");
    let user = await getUser(discordID, "discord", false);
    if (!user) {
        console.log("User not found, creating user...");
        const osuID = await getInfo("Enter your osu! user ID (Example: 12345678): ");
        user = await getUser(osuID, "osu", true);
        const discordUser = await discordClient.users.fetch(discordID);
        if (discordUser) {
            user.discord = new DiscordOAuth();
            user.discord.userID = discordID;
            user.discord.username = discordUser.username;
            user.discord.avatar = discordUser.displayAvatarURL();
        }
        user = await user.save();
    }
    tournament.organizer = user;

    // QL Stage
    const qualifierStage = new Stage();
    qualifierStage.name = "Qualifiers";
    qualifierStage.abbreviation = "QL";
    qualifierStage.createdBy = user;
    qualifierStage.order = 1;
    qualifierStage.stageType = StageType.Qualifiers;
    qualifierStage.timespan = {
        start: currDate,
        end: new Date(currDate.getTime() + 1000 * 60 * 60 * 24 * 30),
    };
    qualifierStage.initialSize = -1;
    qualifierStage.finalSize = 32;
    qualifierStage.scoringMethod = ScoringMethod.ScoreV2;
    qualifierStage.rounds = [];
    tournament.stages.push(qualifierStage);

    // Single Elim Stage
    const singleElimStage = new Stage();
    singleElimStage.name = "Single Elimination";
    singleElimStage.abbreviation = "SE";
    singleElimStage.createdBy = user;
    singleElimStage.order = 2;
    singleElimStage.stageType = StageType.Singleelimination;
    singleElimStage.timespan = {
        start: new Date(currDate.getTime() + 1000 * 60 * 60 * 24 * 30),
        end: new Date(currDate.getTime() + 1000 * 60 * 60 * 24 * 60),
    };
    singleElimStage.initialSize = 32;
    singleElimStage.finalSize = 1;
    singleElimStage.scoringMethod = ScoringMethod.ScoreV2;
    const rounds: Round[] = [];
    for (let i = 32; i > 1; i /= 2) {
        const round = new Round();
        if (i === 8) {
            round.name = "Quarterfinals";
            round.abbreviation = "QF";
        } else if (i === 4) {
            round.name = "Semifinals";
            round.abbreviation = "SF";
        } else if (i === 2) {
            round.name = "Finals";
            round.abbreviation = "F";
        } else {
            round.name = `Round of ${i}`;
            round.abbreviation = `RO${i}`;
        }
        rounds.push(round);
    }
    singleElimStage.rounds = rounds;
    tournament.stages.push(singleElimStage);

    await tournament.save();
    tournament.stages = await Promise.all(tournament.stages.map(async s => {
        s.tournament = tournament;
        await s.save();
        s.rounds = await Promise.all(s.rounds.map(async r => {
            r.stage = s;
            return r.save();
        }));
        return s;
    }));

    console.log(`\x1b[42;1mTournament ${tournament.name} created successfully\x1b[0m`);

    
    let discordServer = await discordGuild();

    const embed = new EmbedBuilder()
        .setTitle(tournament.name)
        .setDescription(tournament.description)
        .addFields(
            { name: "Mode", value: tournament.mode.name, inline: true },
            { name: "Matchup Size", value: tournament.matchupSize.toString(), inline: true },
            { name: "Allowed Team Size", value: `${tournament.minTeamSize} - ${tournament.maxTeamSize}`, inline: true },
            { name: "Registration Start Date", value: discordStringTimestamp(tournament.registrations.start), inline: true },
            { name: "Registration End Date", value: discordStringTimestamp(tournament.registrations.end), inline: true },
            { name: "Stages", value: tournament.stages.map(s => `${s.name} (${s.abbreviation})`).join(", "), inline: true },
            { name: "Server", value: tournament.server, inline: true }
        )
        .setTimestamp()
        .setAuthor({ name: user.discord.username, icon_url: user.discord.avatar });

    if (tournament.isOpen || tournament.isClosed)
        embed.addFields(
            { name: "Corsace", value: tournament.isOpen ? "Open" : "Closed", inline: true }
        );

    let channelToSendEmbed = await discordClient.channels.fetch(config.discord.coreChannel);
    if (!channelToSendEmbed?.isTextBased()) {
        // Find literally any text channel
        const channels = discordServer.channels.cache.filter(c => c.isTextBased());
        if (channels.size > 0)
            channelToSendEmbed = channels.first()!;
    }

    if (channelToSendEmbed?.isTextBased()) {
        await channelToSendEmbed.send({ embeds: embed.build() });
        console.log(`\x1b[42;1mEmbed containing tournament information sent to ${channelToSendEmbed.url}\x1b[0m`);
    }

    if (res === "base") {
        console.log("Base tournament created successfully");
        exit(0);
    }

    /*
    / Role + channel creation
    / Starts here
    */

    const rolesToMake = await checkbox({
        message: "Select which roles to create",
        choices: Object.keys(TournamentRoleType).filter(t => isNaN(Number(t))).map((role) => ({
            name: role,
            value: TournamentRoleType[role as keyof typeof TournamentRoleType],
            checked: true,
        })),
    });
    let channelsToMake = await checkbox({
        message: "Select which channels to create",
        choices: Object.keys(TournamentChannelType).filter(t => isNaN(Number(t))).map((channel) => ({
            name: channel,
            value: TournamentChannelType[channel as keyof typeof TournamentChannelType],
            checked: true,
        })),
    });

    if (channelsToMake.some(c => [
        TournamentChannelType.Announcements,
        TournamentChannelType.Streamannouncements,
        TournamentChannelType.Jobboard,
        TournamentChannelType.Mappoolqa,
    ].includes(c)) && !discordServer.features.includes("COMMUNITY")) {
        const isCommunityServer = await getInfo("The following types of channels need your dev server to be designated as a community server:\n- Announcements\n- Stream Announcements\n- Job Board\n- Mappool QA\nYou can create a community server by going to your server settings -> Community -> Enable Community\nIs your server a community server? (yes/no) Default: no: ");
        if (isCommunityServer.toLowerCase() !== "yes") {
            channelsToMake = channelsToMake.filter(c => ![
                TournamentChannelType.Announcements,
                TournamentChannelType.Streamannouncements,
                TournamentChannelType.Jobboard,
                TournamentChannelType.Mappoolqa,
            ].includes(c));
        } else
            discordServer = await discordGuild();
    }

    for (const role of rolesToMake) {
        const discordRole = await discordServer.roles.create({
            name: `${tournament.name} ${TournamentRoleType[role]}`,
            reason: `Created by ${user.discord.username} for the tournament ${tournament.name}`,
            mentionable: true,
        });
        const tournamentRole = new TournamentRole();
        tournamentRole.createdBy = user;
        tournamentRole.roleID = discordRole.id;
        tournamentRole.roleType = role;
        tournament.roles.push(tournamentRole);
    }

    for (const channel of channelsToMake) {
        let channelType = ChannelType.GuildText;
        if (channel === TournamentChannelType.Announcements || channel === TournamentChannelType.Streamannouncements)
            channelType = ChannelType.GuildAnnouncement;
        if (channel === TournamentChannelType.Jobboard || channel === TournamentChannelType.Mappoolqa)
            channelType = ChannelType.GuildForum;

        const channelObject: GuildChannelCreateOptions = {
            type: channelType,
            name: `${tournament.abbreviation}-${TournamentChannelType[channel]}`,
            topic: `Tournament ${tournament.name} channel for ${TournamentChannelType[channel]}`,
            reason: `${tournament.name} channel created by ${user.discord.username} for ${TournamentChannelType[channel]} purposes.`,
            defaultAutoArchiveDuration: 10080,
        };
        const allowedRoleTypes = getTournamentChannelTypeRoles()[channel];
        if (allowedRoleTypes !== undefined) {
            channelObject.permissionOverwrites = [
                {
                    id: discordServer.id, // the ID of the @everyone role is the same as the guild ID
                    deny: PermissionFlagsBits.ViewChannel,
                },
            ];
            const allowedRoles = tournament.roles.filter(r => allowedRoleTypes.includes(r.roleType));
            channelObject.permissionOverwrites.push(...allowedRoles.map(r => {
                return {
                    id: r.roleID,
                    allow: PermissionFlagsBits.ViewChannel,
                };
            }));
            

            if (channel === TournamentChannelType.Mappoollog)
                channelObject.permissionOverwrites[0].deny = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;
        }

        if (channel === TournamentChannelType.Mappoolqa)
            channelObject.availableTags = [{
                name: "WIP",
                moderated: true,
            },{
                name: "Finished",
                moderated: true,
            },{
                name: "Late",
                moderated: true,
            },{
                name: "Needs HS",
                moderated: true,
            }];
        else if (channel === TournamentChannelType.Jobboard)
            channelObject.availableTags = [{
                name: "Open",
                moderated: true,
            },{
                name: "Closed",
                moderated: true,
            },{
                name: "To Assign",
                moderated: true,
            }];

        const discordChannel = await discordServer.channels.create(channelObject);
        const tournamentChannel = new TournamentChannel();
        tournamentChannel.createdBy = user;
        tournamentChannel.channelType = channel;
        tournamentChannel.channelID = discordChannel.id;
        tournament.channels.push(tournamentChannel);
    }
    
    tournament.channels = await Promise.all(tournament.channels.map(async c => {
        c.tournament = tournament;
        return c.save();
    }));
    tournament.roles = await Promise.all(tournament.roles.map(async r => {
        r.tournament = tournament;
        return r.save();
    }));

    console.log(`\x1b[42;1mRoles and channels created successfully\x1b[0m`);

    const rolesEmbed = new EmbedBuilder()
        .setTitle("Roles")
        .addFields(
            tournament.roles.map(r => {
                return {
                    name: TournamentRoleType[r.roleType],
                    value: `<@&${r.roleID}>`,
                };
            }));

    const channelsEmbed = new EmbedBuilder()
        .setTitle("Channels")
        .addFields(
            tournament.channels.map(c => {
                return {
                    name: TournamentChannelType[c.channelType],
                    value: `<#${c.channelID}>`,
                };
            }));

    if (channelToSendEmbed?.isTextBased()) {
        await channelToSendEmbed.send({ embeds: rolesEmbed.build() });
        await channelToSendEmbed.send({ embeds: channelsEmbed.build() });
        console.log(`\x1b[42;1mEmbeds containing role and channel information sent to ${channelToSendEmbed.url}\x1b[0m`);
    }

    if (res === "discord") {
        console.log("Roles and channels created successfully");
        exit(0);
    }

    /*
    / Mappool creation
    / Starts here
    */

    const qualifierMappool = new Mappool();
    qualifierMappool.createdBy = user;
    qualifierMappool.stage = qualifierStage;
    qualifierMappool.slots = [
        createSlot("Nomod", "NM", 3, user, 0),
        createSlot("Hidden", "HD", 2, user, 8),
        createSlot("HardRock", "HR", 2, user, 16),
        createSlot("DoubleTime", "DT", 3, user, 64),
    ];
    qualifierMappool.targetSR = 7;
    qualifierMappool.name = qualifierStage.name;
    qualifierMappool.abbreviation = qualifierStage.abbreviation;
    qualifierMappool.order = 1;

    const singleElimMappool = new Mappool();
    singleElimMappool.createdBy = user;
    singleElimMappool.stage = singleElimStage;
    singleElimMappool.slots = [
        createSlot("Nomod", "NM", 5, user, 0),
        createSlot("Hidden", "HD", 3, user, 8),
        createSlot("HardRock", "HR", 3, user, 16),
        createSlot("DoubleTime", "DT", 3, user, 64),
        createSlot("FreeMod", "FM", 2, user, undefined, 2, 2),
        createSlot("Tiebreaker", "TB", 1, user),
    ];
    singleElimMappool.targetSR = 7;
    singleElimMappool.name = singleElimStage.name;
    singleElimMappool.abbreviation = singleElimStage.abbreviation;
    singleElimMappool.order = 1;

    await qualifierMappool.save();
    qualifierMappool.slots.forEach(async s => {
        s.mappool = qualifierMappool;
        await s.save();
        s.maps.forEach(async m => {
            m.slot = s;
            await m.save();
        });
    });
    await singleElimMappool.save();
    singleElimMappool.slots.forEach(async s => {
        s.mappool = singleElimMappool;
        await s.save();
        s.maps.forEach(async m => {
            m.slot = s;
            await m.save();
        });
    });

    console.log(`\x1b[42;1mMappools ${qualifierMappool.name} and ${singleElimMappool.name} created successfully\x1b[0m`);

    const qlPoolEmbed = new EmbedBuilder()
        .setTitle(`${qualifierMappool.name} (${qualifierMappool.abbreviation.toUpperCase()})`)
        .setDescription(`Target SR: ${qualifierMappool.targetSR}`)
        .addFields(
            qualifierMappool.slots.map((slot) => {
                return {
                    name: `${slot.acronym} - ${slot.name}`,
                    value: `${slot.maps.length} map${slot.maps.length > 1 ? "s" : ""}`,
                };
            }));
    const sePoolEmbed = new EmbedBuilder()
        .setTitle(`${singleElimMappool.name} (${singleElimMappool.abbreviation.toUpperCase()})`)
        .setDescription(`Target SR: ${singleElimMappool.targetSR}`)
        .addFields(
            singleElimMappool.slots.map((slot) => {
                return {
                    name: `${slot.acronym} - ${slot.name}`,
                    value: `${slot.maps.length} map${slot.maps.length > 1 ? "s" : ""}`,
                };
            }));

    if (channelToSendEmbed?.isTextBased()) {
        await channelToSendEmbed.send({ embeds: qlPoolEmbed.build() });
        await channelToSendEmbed.send({ embeds: sePoolEmbed.build() });
        console.log(`\x1b[42;1mEmbeds containing mappool information sent to ${channelToSendEmbed.url}\x1b[0m`);
    }

    if (res === "mappools") {
        console.log("Mappools created successfully");
        exit(0);
    }

    /*
    / Team creation
    / Starts here
    */

    let timeZone = await getInfo("Enter your timezone relative to UTC (Example: -5): ");
    if (isNaN(Number(timeZone))) {
        console.log("Invalid timezone entered, defaulting to UTC");
        timeZone = "0";
    }

    const team1 = new Team();
    team1.name = "Team 1";
    team1.abbreviation = "T1";
    team1.timezoneOffset = Number(timeZone);
    team1.members = [user];
    team1.captain = user;
    await team1.calculateStats();
    await team1.save();

    const team2 = new Team();
    team2.name = "Team 2";
    team2.abbreviation = "T2";
    team2.timezoneOffset = Number(timeZone);
    team2.members = [user];
    team2.captain = user;
    await team2.calculateStats();
    await team2.save();

    console.log(`\x1b[42;1mTeams ${team1.name} and ${team2.name} created successfully\x1b[0m`);

    const participantRoles = tournament.roles.filter(r => r.roleType === TournamentRoleType.Participants);
    const captainRoles = tournament.roles.filter(r => r.roleType === TournamentRoleType.Captains);

    const discordUser = await discordServer.members.fetch(user.discord.userID);
    await discordUser.roles.add([...participantRoles.map(r => r.roleID), ...captainRoles.map(r => r.roleID)]);

    tournament.teams = [team1, team2];
    await tournament.save();

    if (res === "teams") {
        console.log("Teams created successfully");
        exit(0);
    }

    /*
    / Match creation
    / Starts here
    */

    const matchup1 = new Matchup();
    matchup1.date = qualifierStage.timespan.start;
    matchup1.teams = [ team1 ];
    matchup1.stage = qualifierStage;
    await matchup1.save();

    const matchup2 = new Matchup();
    matchup2.date = qualifierStage.timespan.start;
    matchup2.teams = [ team2 ];
    matchup2.stage = qualifierStage;
    await matchup2.save();

    const matchup3 = new Matchup();
    matchup3.date = singleElimStage.timespan.start;
    matchup3.team1 = team1;
    matchup3.team2 = team2;
    matchup3.stage = singleElimStage;
    await matchup3.save();

    console.log("Matches created successfully\n\x1b[41;1mPlease make sure you add maps to the mappools and publish them before working on the matches\x1b[0m");
    exit(0);
}).catch(console.error);