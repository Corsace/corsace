import Router from "@koa/router";
import { UserAuthenticatedState } from "koa";
import { OAuth, User } from "../../../Models/user";
import { UsernameChange } from "../../../Models/usernameChange";
import { isCorsace, isHeadStaff, isLoggedIn } from "../../middleware";

const userRouter = new Router<UserAuthenticatedState>();

userRouter.use(isLoggedIn);

userRouter.get("/", async (ctx) => {
    ctx.body = {
        success: true,
        user: await ctx.state.user.getInfo(),
    };
});

userRouter.get("/mca", async (ctx) => {
    ctx.body = {
        success: true,
        user: await ctx.state.user.getMCAInfo(),
    };
});

interface connectBody {
    osu: {
        username: string;
        userID: string;
    };
    discord: {
        username: string;
        userID: string;
    };
}

userRouter.post("/connect", isCorsace, async (ctx) => {
    const body: connectBody = ctx.request.body;
    if (!body.osu || !body.discord)
        return ctx.body = { 
            error: "Missing parameters",
        };

    const { osu, discord } = body;

    const user = await User.findOne({ 
        where: { 
            osu: { 
                userID: osu.userID,
            },
        },
    });

    if (!user)
        return ctx.body = { 
            error: "User not found",
        };

    user.discord = discord as OAuth;

    await user.save();

    ctx.body = {
        success: true,
        user,
    };
});

userRouter.post("/username/delete", isHeadStaff, async (ctx) => {
    const body = ctx.request.body;
    if (!body.ID || !body.username)
        return ctx.body = { 
            error: "Missing parameters",
        };
    
    const user = await User.findOneOrFail({
        where: {
            ID: body.ID,  
        },
    });

    if (user.osu.username === body.username) {
        const otherNames = await UsernameChange.find({  
            where: { 
                user: {
                    ID: user.ID,
                }, 
            },
        });
        if (otherNames.length === 0) {
            return ctx.body = { 
                error: "No remaining username to change to.",
            };
        }
        user.osu.username = otherNames[0].name;
        await user.save();
        await otherNames[0].remove();
        return ctx.body = {
            success: true,
            user,
        };
    }

    const name = await UsernameChange.findOneOrFail({
        where: {  
            user: {
                ID: user.ID,
            }, 
            name: body.username,
        },
    });
    await name.remove();
    return ctx.body = {
        success: true,
        user,
    };
});

export default userRouter;
