import Router, { Middleware } from "@koa/router";
import { Phase } from "../../../../Models/phase";
import { Bracket } from "../../../../Models/tournaments/bracket";
import { Group } from "../../../../Models/tournaments/group";
import { Mappool } from "../../../../Models/tournaments/mappool";
import { Qualifier } from "../../../../Models/tournaments/qualifier";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";

const adminTournamentRouter = new Router;

adminTournamentRouter.use(isLoggedInDiscord);
adminTournamentRouter.use(isCorsace);

const validate: Middleware = async (ctx, next) => {
    const data = ctx.request.body;

    if (!data.name) {
        return ctx.body = { error: "Missing tournament name!" };
    } else if (!data.registrationStart) {
        return ctx.body = { error: "Missing registrationStart date!" };
    } else if (!data.registrationEnd) {
        return ctx.body = { error: "Missing registrationEnd date!" };
    } else if (!data.size) {
        return ctx.body = { error: "Missing team amount!" };
    } else if (!data.doubleElim) {
        return ctx.body = { error: "Missing double elimination boolean!" };
    } else if (!data.firstStage || (data.firstStage !== 'group' && data.firstStage !== 'qualifier')) {
        return ctx.body = { error: "Missing valid first stage value!" };
    }

    await next();
};

adminTournamentRouter.get("/", async (ctx) => {
    const tournaments = await Tournament.find({
        order: {
            ID: "ASC",
        }
    });
    ctx.body = {
        tournaments,
    }
});

adminTournamentRouter.post("/", validate, async (ctx) => {
    const data = ctx.request.body;

    // Create tournament
    const tournament = new Tournament;
    tournament.name = data.name;
    tournament.registration = new Phase;
    tournament.registration.start = new Date(data.registrationStart);
    tournament.registration.end = new Date(data.registrationEnd);
    tournament.size = data.size;
    tournament.doubleElim = data.doubleElim;
    await tournament.save();

    // Create groups / qualifiers and their respective mappools
    const groups: Group[] = [];
    const qualifiers: Qualifier[] = [];
    const brackets: Bracket[] = [];
    if (data.firstStage === 'group') {
        // Create groups mappool
        const mappool = new Mappool;
        mappool.name = "GROUPS";
        mappool.tournament = tournament;
        await mappool.save();

        // Creates x amount of groups for 4 teams to be in each
        const groupAmount = Math.ceil(tournament.size / 4);
        for (let i = 0; i < groupAmount; i++) {
            const group = new Group;
            group.tournament = tournament;
            group.mappool = mappool;
            await group.save();

            groups.push(group);
        }
    } else {
        // Create qualifiers mappool
        const mappool = new Mappool;
        mappool.name = "QUALIFIERS";
        mappool.tournament = tournament;
        await mappool.save();

        // Gives 13 days for screening and mappool release
        let time = new Date;
        time.setDate(tournament.registration.end.getDate() + 13)
        let lastTime = new Date;
        lastTime.setDate(tournament.registration.end.getDate() + 15)

        // Creates qualifiers for every 30 minutes
        while (time.getTime() !== lastTime.getTime()) {
            const qualifier = new Qualifier;
            qualifier.time = time;
            qualifier.tournament = tournament;
            qualifier.mappool = mappool;
            await qualifier.save();

            qualifiers.push(qualifier);
            time.setTime(time.getTime() + 30 * 60 * 1000);
        }
    }

    // Create brackets
    let numLeft = 1;
    while (numLeft <= tournament.size) {
        if (numLeft === 1 && !tournament.doubleElim) {
            numLeft = 2;
            continue;
        }

        // Create mappool for the bracket
        const mappool = new Mappool;
        if (numLeft >= 16)
            mappool.name = `ROUND OF ${numLeft}`
        else if (numLeft === 8)
            mappool.name = "QUARTER FINALS";
        else if (numLeft === 4)
            mappool.name = "SEMI FINALS";
        else if (numLeft === 2)
            mappool.name = "FINALS";
        else if (numLeft === 1)
            mappool.name = "GRAND FINALS";
        mappool.tournament = tournament;
        await mappool.save();
        
        // Create the actual bracket now lol
        const bracket = new Bracket;
        bracket.name = mappool.name;
        bracket.mappool = mappool;
        bracket.tournament = tournament;
        await bracket.save();

        brackets.push(bracket);
        numLeft *= 2;
    }

    ctx.body = {
        tournament,
        qualifiers,
        groups,
        brackets,
    }
});

adminTournamentRouter.delete("/:id", async (ctx) => {
    if (!/\d+/.test(ctx.params.id)) {
        ctx.body = {
            error: `${ctx.params.id} is an invalid ID!`,
        };
        return;
    }

    const tournament = await Tournament.findOne(ctx.params.id);
    if (!tournament) {
        ctx.body = {
            error: `No tournament with ${ctx.params.id} exists!`,
        };
        return;
    };

    const [groups, qualifiers, brackets, mappools] = await Promise.all([
        Group.find({ tournament }),
        Qualifier.find({ tournament }),
        Bracket.find({ tournament }),
        Mappool.find({ tournament }),
    ]);

    await Promise.all(groups.map(group => group.remove()));
    await Promise.all(qualifiers.map(qualifier => qualifier.remove()));
    await Promise.all(brackets.map(bracket => bracket.remove()));
    await Promise.all(mappools.map(pool => pool.remove()));

    await tournament.remove();

    ctx.body = {
        success: `${tournament.name} is gone`
    }
    return;
});

export default adminTournamentRouter;
