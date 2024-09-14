import { MongoClient } from "mongodb";
import ormConfig from "../../ormconfig";
import {ModeDivision} from "../../Models/MCA_AYIM/modeDivision";
import {OsuOAuth, User} from "../../Models/user";
import {Tournament, TournamentStatus} from "../../Models/tournaments/tournament";
import {Team} from "../../Models/tournaments/team";

void (async () => {
    await ormConfig.initialize();
    await ormConfig.transaction(async (entityManager) => {
        const mongoClient = new MongoClient("mongodb://localhost:27017");
        const db = mongoClient.db("corsace-open");
        const teams = db.collection("teams");
        const users = db.collection("users");

        // TODO: avatars

        const year = 2021;

        async function getDbUser (user: any) {
            let dbUser = await User.findOne({ where: { osu: { userID: user.osu.userId } } });
            if (!dbUser) {
                dbUser = new User();
                dbUser.osu = new OsuOAuth();
                dbUser.osu.userID = `${user.osu.userId}`;
                dbUser.osu.username = `${user.osu.cache.body.username}`;
                dbUser.osu.avatar = "https://a.ppy.sh/" + user.osu.userId;
                dbUser.country = user.osu.cache.body.country.code;
                dbUser = await entityManager.save(dbUser);
            }
            return dbUser;
        }

        const organizer = await getDbUser({
            osu: {
                userId: 4323406,
                cache: {
                    body: {
                        username: "VINXIS",
                        country: {
                            code: "CA",
                        },
                    },
                },
            },
        });
        const mode = await ModeDivision.findOneOrFail({ where: { name: "standard" } });
        // TODO: do not forget to change the hard-coded values :)
        let tournament = Tournament.create({
            name: `Corsace Open ${year}`,
            abbreviation: `CO${`${year}`.slice(2)}`,
            invitational: false,
            isClosed: false,
            isOpen: true,
            year,
            description: `The ${year} edition of Corsace Open, one of osu!'s most prestigious unofficial 4v4 tournaments. Organized by Corsace, this open rank tournament gathers some of the most talented players from around the world, serving as a testament to the skill, strategy, and teamwork inherent in the rhythm game community.`,
            status: TournamentStatus.Finished,
            server: "461569547145838596",
            organizer,
            captainMustPlay: false,
            matchupSize: 4,
            minTeamSize: 6,
            maxTeamSize: 8,
            mode,
            registrations: {
                start: new Date("2021-07-05T00:38:00Z"),
                end: new Date("2021-07-25T12:00:00Z"),
            },
        });
        tournament = await entityManager.save(tournament);

        for await (const team of teams.find({ rank: { $ne: null } })) {
            const members = [];
            for await (const user of users.find({ team: team._id })) {
                members.push(await getDbUser(user));
            }
            const captainUser = await users.findOne(team.captain);
            const captain = members.find((m) => m.osu.userID === captainUser!.osu.userId) ?? await getDbUser(captainUser);
            const teamNameSplit = (team.name as string).split(" ");
            const abbreviation = teamNameSplit.length < 2 || teamNameSplit.length > 4 ?
                teamNameSplit[0].slice(0, Math.min(teamNameSplit[0].length, 4)) :
                teamNameSplit.map(n => n[0]).join("");
            let dbTeam = Team.create({
                name: team.name,
                abbreviation,
                members,
                captain,
                tournaments: [tournament],
                BWS: 0,
                rank: 0,
                pp: 0,
            });
            dbTeam = await entityManager.save(dbTeam);
        }
    });

    console.log("Done");
    process.exit();
})();
