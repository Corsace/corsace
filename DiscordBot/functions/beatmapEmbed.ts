import { MessageEmbed, MessageEmbedOptions } from "discord.js";
import { ApprovalStatus, Beatmap, BeatmapScore, Mode, Score, UserScore } from "nodesu";
import { acronymtoMods, modsToAcronym } from "../../Interfaces/mods";
import { User } from "../../Models/user";
import { discordGuild } from "../../Server/discord";
import { osuClient } from "../../Server/osu";
import modeColour from "./modeColour";
import ppCalculator from "./ppCalculator";

export default async function beatmapEmbed (beatmap: Beatmap, mods: string, set?: Beatmap[], missCount?: number, score?: UserScore, user?: User, isRecent?: boolean): Promise<MessageEmbed> {

    const embedMsg = defaultBeatmapEmbed(beatmap, score && user ? false : true);

    const totalHits = beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner;

    if (score && user) {
        // Get score info
        const scoreMod = ` **+${modsToAcronym(score.enabledMods ?? 0)}** `;
        const scoreRank = (await discordGuild()).emojis.cache.find(e => e.name === `${score.rank}_`)?.toString();
        const scorePrint = ` **${score.score.toLocaleString()}** `;
        const combo = " **" + (score.maxCombo === beatmap.maxCombo ? score.count300 === totalHits ? "SS " : "FC " : `${score.maxCombo}**/${beatmap.maxCombo}x `);
        const acc = `**${(100.0 * (6.0 * score.count300 + 2.0 * score.count100 + score.count50) / (6.0 * (score.count300 + score.count100 + score.count50 + score.countMiss))).toFixed(2)}%** `;
        const hits = `**Hits:** [${score.count300}/${score.count100}/${score.count50}/${score.countMiss}]`;

        // Get map completion amount + leaderboard / top perf if applicable
        let mapCompletion = "";
        const scoreHits = score.countMiss + score.count50 + score.count100 + score.count300;
        if (scoreHits !== totalHits)
            mapCompletion = `**${(100.0 * scoreHits / totalHits).toFixed(2)}%** completed \n`;
        else {
            const bestScores = (await osuClient.user.getBest(user.osu.userID, Mode.all, 100)) as UserScore[];
            for (const i in bestScores) {
                const bestScore = bestScores[i];
                if (bestScore.score === score.score && bestScore.beatmapId === score.beatmapId) {
                    mapCompletion += `**#${parseInt(i) + 1}** in top performances! \n`;
                    break;
                }
            }
            const beatmapScores = (await osuClient.scores.get(score.beatmapId, Mode.all, 100)) as BeatmapScore[];
            for (const i in beatmapScores) {
                const beatmapScore = beatmapScores[i];
                if (beatmapScore.score === score.score && beatmapScore.userId === score.userId) {
                    mapCompletion += `**#${parseInt(i) + 1}** on leaderboard! \n`;
                    break;
                }
            }
        }

        // The dreaded replay data (TODO)
        let replay = "";
        if (score.replayAvailable)
            replay = " | Replay data is not available yet!";

        // Get pp value(s)
        let pp = "";
        if (score.pp === 0 || isNaN(score.pp)) { // Didn't finish
            if (scoreHits === totalHits) // Laugh at them for failing at the end
                mapCompletion += "**FAILED RIGHT AT THE END LMFAO** \n";
            const FCVersion = new Score({
                maxcombo: beatmap.maxCombo,
                count300: totalHits - score.count100 - score.count50,
                count100: score.count100,
                count50: score.count50,
                enabled_mods: acronymtoMods(mods),
            });
            pp = `~~**${ppCalculator(beatmap, score).toFixed(2)}pp**~~/${ppCalculator(beatmap, FCVersion).toFixed(2)}pp `;
        } else if (score.perfect) // Perfect combo
            pp = `**${score.pp.toFixed(2)}pp**/${score.pp.toFixed(2)}pp `;
        else { // Finished, not perfect combo
            if (score.countMiss === 1 && score.maxCombo === beatmap.maxCombo - 1) // Laugh at them for their terrible choke
                mapCompletion += "**WHAT IS THAT CHOKE LMFAO** \n";
            const FCVersion = new Score({
                maxcombo: beatmap.maxCombo,
                count300: totalHits - score.count100 - score.count50,
                count100: score.count100,
                count50: score.count50,
                enabled_mods: acronymtoMods(mods),
            });
            pp = `**${score.pp.toFixed(2)}pp**/${ppCalculator(beatmap, FCVersion).toFixed(2)}pp `;
        }

        embedMsg.title = `${beatmap.artist} - ${beatmap.title} [${beatmap.version}] by ${beatmap.creator}`;
        embedMsg.url = `https://osu.ppy.sh/beatmaps/${beatmap.id}`;
        embedMsg.author = {
            url: `https://osu.ppy.sh/users/${user.osu.userID}`,
            name: user.osu.username,
            iconURL: `${user.osu.avatar}`,
        };
        embedMsg.description += "\n" + 
            scoreRank + scorePrint + scoreMod + combo + acc + replay + "\n" +
            mapCompletion + "\n" +
            pp + hits + "\n" + "\n";
    } else if (set) {
        // Get extra beatmap information
        const download = `**Download:** [osz link](https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}/download) | <osu://dl/${beatmap.beatmapSetId}>`;
        let diffs = `**${set.length}** difficulties`;
        if (set.length === 1)
            diffs = "**1** difficulty";

        // Not sure if there's a better way to get this
        let rankStatus = "Graveyard";
        for (const status of Object.keys(ApprovalStatus)) {
            if (beatmap.approved === ApprovalStatus[status]) {
                rankStatus = `${status[0].toUpperCase()}${status.substring(1)}`; 
            }
        }
        const status = `**Rank Status:** ${rankStatus}`;

        // Creating scores for pp calc
        const misses = missCount ?? 0;
        const score100 = new Score({
            maxcombo: beatmap.maxCombo,
            count300: totalHits,
            count100: 0,
            count50: 0,
            countmiss: 0,
            enabled_mods: acronymtoMods(mods),
        });
        const score99 = new Score({
            maxcombo: beatmap.maxCombo,
            count300: (0.99 * totalHits * 6 - totalHits + misses) / 5,
            count100: (0.99 * totalHits * 6 - totalHits + misses) % 5,
            count50: totalHits - (0.99 * totalHits * 6 - totalHits + misses) / 5 - (0.99 * totalHits * 6 - totalHits + misses) % 5 - misses,
            countmiss: misses,
            enabled_mods: acronymtoMods(mods),
        });
        const score98 = new Score({
            maxcombo: beatmap.maxCombo,
            count300: (0.98 * totalHits * 6 - totalHits + misses) / 5,
            count100: (0.98 * totalHits * 6 - totalHits + misses) % 5,
            count50: totalHits - (0.98 * totalHits * 6 - totalHits + misses) / 5 - (0.98 * totalHits * 6 - totalHits + misses) % 5 - misses,
            countmiss: misses,
            enabled_mods: acronymtoMods(mods),
        });
        const score97 = new Score({
            maxcombo: beatmap.maxCombo,
            count300: (0.97 * totalHits * 6 - totalHits + misses) / 5,
            count100: (0.97 * totalHits * 6 - totalHits + misses) % 5,
            count50: totalHits - (0.97 * totalHits * 6 - totalHits + misses) / 5 - (0.97 * totalHits * 6 - totalHits + misses) % 5 - misses,
            countmiss: misses,
            enabled_mods: acronymtoMods(mods),
        });
        const score95 = new Score({
            maxcombo: beatmap.maxCombo,
            count300: (0.95 * totalHits * 6 - totalHits + misses) / 5,
            count100: (0.95 * totalHits * 6 - totalHits + misses) % 5,
            count50: totalHits - (0.95 * totalHits * 6 - totalHits + misses) / 5 - (0.95 * totalHits * 6 - totalHits + misses) % 5 - misses,
            countmiss: misses,
            enabled_mods: acronymtoMods(mods),
        });
        const ppTextHeader = `**[${beatmap.version}]** with mods: **${mods}**`;
        const ppText = `**100%:** ${Math.floor(ppCalculator(beatmap, score100))}pp | **99%:** ${Math.floor(ppCalculator(beatmap, score99))}pp | **98%:** ${Math.floor(ppCalculator(beatmap, score98))}pp | **97%:** ${Math.floor(ppCalculator(beatmap, score97))}pp | **95%:** ${Math.floor(ppCalculator(beatmap, score95))}pp`;

        embedMsg.author = {
            url: `https://osu.ppy.sh/beatmaps/${beatmap.beatmapId}`,
            name: `${beatmap.artist} - ${beatmap.title} by ${beatmap.creator}`,
            iconURL: `https://a.ppy.sh/${beatmap.creatorId}`,
        };
        embedMsg.description += status + "\n" +
            download + "\n" +
            diffs + "\n" + "\n" +
            ppTextHeader + "\n" +
            ppText;
        embedMsg.footer = {
            text: `Corsace | https://corsace.io`,
        };
    } else
        throw new Error("Please provide either set + miss count, or score + user params!");

    return new MessageEmbed(embedMsg);
}

function defaultBeatmapEmbed (beatmap: Beatmap, addFC: boolean): MessageEmbedOptions {
    // Obtain beatmap information
    const totalMinutes = Math.floor(beatmap.totalLength / 60);
    let totalSeconds = `${Math.round(beatmap.totalLength % 60)}`;
    if (totalSeconds.length === 1)
        totalSeconds = `0${totalSeconds}`;
    const hitMinutes = Math.floor(beatmap.hitLength / 60);
    let hitSeconds = `${Math.round(beatmap.hitLength % 60)}`;
    if (hitSeconds.length === 1)
        hitSeconds = `0${hitSeconds}`;

    let sr = `**SR:** ${beatmap.difficultyRating.toFixed(2)}`;
    if (beatmap.mode === Mode.osu)
        sr += ` **Aim:** ${beatmap.diffAim.toFixed(2)} **Speed:** ${beatmap.diffSpeed.toFixed(2)}`;
    const length = `**Length:** ${totalMinutes}:${totalSeconds} (${hitMinutes}:${hitSeconds}) `;
    const bpm = `**BPM:** ${beatmap.bpm} `;
    const combo = addFC ? `**FC:** ${beatmap.maxCombo}x` : "";
    const mapStats = `**CS:** ${beatmap.CS.toFixed(2)} **AR:** ${beatmap.AR.toFixed(2)} **OD:** ${beatmap.OD.toFixed(2)} **HP:** ${beatmap.HP.toFixed(2)}`;
    const mapObjs = `**Circles:** ${beatmap.countNormal} **Sliders:** ${beatmap.countSlider} **Spinners:** ${beatmap.countSpinner}`;

    return {
        description: sr + "\n" +
			length + bpm + combo + "\n" +
			mapStats + "\n" +
			mapObjs + "\n",
        color: modeColour(beatmap.mode),
        thumbnail: {
            url: `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`,
        },
    };
}