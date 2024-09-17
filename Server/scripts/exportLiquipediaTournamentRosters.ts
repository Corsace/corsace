import ormConfig from "../../ormconfig";
import {Tournament} from "../../Models/tournaments/tournament";

void (async () => {
    await ormConfig.initialize();

    const tournament = await Tournament.createQueryBuilder("tournament")
        .where("tournament.isOpen = true")
        .andWhere("tournament.year = 2021")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.captain", "captain")
        .getOne();
    if (!tournament) {
        console.log("No tournament found");
        return;
    }

    console.log("name,abbreviation,avatarURL,captainOsuUserid,captainOsuUsername,captainCountry,p1OsuUserid,p1OsuUsername,p1Country,p2OsuUserid,p2OsuUsername,p2Country,p3OsuUserid,p3OsuUsername,p3Country,p4OsuUserid,p4OsuUsername,p4Country,p5OsuUserid,p5OsuUsername,p5Country,p6OsuUserid,p6OsuUsername,p6Country,p7OsuUserid,p7OsuUsername,p7Country,p8OsuUserid,p8OsuUsername,p8Country");

    for (const team of tournament.teams) {
        let line = `${team.name},${team.abbreviation},,${team.captain.osu.userID},${team.captain.country}`;
        for (const member of team.members)
            line += `,${member.osu.userID},${member.osu.username},${member.country}`;
        for (let i = team.members.length; i < 8; i++)
            line += ",,,";
        console.log(line);
    }

    process.exit(0);
})();
