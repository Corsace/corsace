import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";
import { OAuth, User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";

async function command (m: Message) {
    const osuRegex = /(osu|profile)\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;

    let user: User;
    let apiUser: APIUser;
    if (!osuRegex.test(m.content) && !profileRegex.test(m.content)) { // Querying themself
        const userQ = await User.findOne({
            discord: {
                userID: m.author.id,
            },
        });
        if (!userQ) {
            await m.channel.send("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
            return;
        }

        apiUser = (await osuClient.user.get(userQ.osu.userID)) as APIUser;
        user = userQ;
    } else { // Querying someone else

        let q = "";
        if (osuRegex.test(m.content)) { // Command run
            const res = osuRegex.exec(m.content);
            if (!res)
                return;
            q = res[2];
            apiUser = (await osuClient.user.get(res[2])) as APIUser;
        } else { // Profile linked
            const res = profileRegex.exec(m.content);
            if (!res)
                return;
            q = res[3];
            apiUser = (await osuClient.user.get(res[3])) as APIUser;
        }

        if (!apiUser) {
            await m.channel.send(`No user found for **${q}**`);
            return;
        }

        let userQ = await User.findOne({
            osu: { 
                userID: apiUser.userId.toString(), 
            },
        });

        if (!userQ) {
            userQ = new User;
            userQ.country = apiUser.country.toString();
            userQ.osu = new OAuth;
            userQ.osu.userID = `${apiUser.userId}`;
            userQ.osu.username = apiUser.username;
            userQ.osu.avatar = "https://a.ppy.sh/" + apiUser.userId;
            await userQ.save();
        }
        user = userQ;
    }
    
    const embedMsg: MessageEmbedOptions = {
        author: {
            url: `https://osu.ppy.sh/users/${user.osu.userID}`,
            name: `${user.osu.username} (${user.osu.userID})`,
            iconURL: `https://osu.ppy.sh/images/flags/${user.country}.png`,
        },
        description: `**PP:** ${apiUser.pp}\n **Rank:** #${apiUser.rank} (${user.country}#${apiUser.countryRank})\n **Acc:** ${apiUser.accuracy.toFixed(2)}%\n **Playcount:** ${apiUser.playcount}\n **SS**: ${apiUser.countRankSS} **S:** ${apiUser.countRankS} **A:** ${apiUser.countRankA}\n **Joined:** ${apiUser.joinDate.toDateString()}`,
        color: 0xFB2475,
        footer: {
            text: `Corsace ID #${user.ID}`,
        },
        thumbnail: {
            url: user.osu.avatar,
        },
    };
    const message = new MessageEmbed(embedMsg);
    m.channel.send({ embeds: [message] });
}

const profile: Command = {
    name: ["osu", "profile"], 
    description: "Obtain your or someone else's osu! profile",
    usage: "!(osu|profile)", 
    category: "osu",
    command,
};

export default profile;