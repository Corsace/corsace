import { CorsaceRouter } from "../../corsaceRouter";
import { UserAuthenticatedState } from "koa";
import { DiscordOAuth, User } from "../../../Models/user";
import { UsernameChange } from "../../../Models/usernameChange";
import { isCorsace, isHeadStaff, isLoggedIn } from "../../middleware";
import { UserInfo, UserMCAInfo } from "../../../Interfaces/user";

const userRouter  = new CorsaceRouter<UserAuthenticatedState>();

userRouter.$use(isLoggedIn);

userRouter.$get<{ user: UserInfo }>("/", async (ctx) => {
    ctx.body = {
        success: true,
        user: await ctx.state.user.getInfo(),
    };
});

userRouter.$get<{ user: UserMCAInfo }>("/mca", async (ctx) => {
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

userRouter.$post<{ user: UserInfo }>("/connect", isCorsace, async (ctx) => {
    const body: connectBody = ctx.request.body;
    if (!body.osu || !body.discord)
        return ctx.body = {
            success: false,
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
            success: false,
            error: "User not found",
        };

    user.discord = discord as DiscordOAuth;

    await user.save();

    ctx.body = {
        success: true,
        user: await user.getInfo(),
    };
});

userRouter.$post<{ user: UserInfo }>("/username/delete", isHeadStaff, async (ctx) => {
    const body = ctx.request.body;
    if (!body.ID || !body.username)
        return ctx.body = {
            success: false,
            error: "Missing parameters",
        };
    
    const user = await User.findOne({
        where: {
            ID: body.ID,  
        },
    });
    if (!user) {
        return ctx.body = {
            success: false,
            error: `Could not find a user with the corsace ID ${body.ID}.`,
        };
    }

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
                success: false,
                error: "No remaining username to change to.",
            };
        }
        user.osu.username = otherNames[0].name;
        await user.save();
        await otherNames[0].remove();
        return ctx.body = {
            success: true,
            user: await user.getInfo(),
        };
    }

    const name = await UsernameChange.findOne({
        where: {  
            user: {
                ID: user.ID,
            }, 
            name: body.username,
        },
    });
    if (!name) {
        return ctx.body = {
            success: false,
            error: `Could not find a username change for corsace ID ${user.ID} username ${user.osu.username} with a previous username of ${body.username}.`,
        };
    }
    await name.remove();
    return ctx.body = {
        success: true,
        user: await user.getInfo(),
    };
});

export default userRouter;
