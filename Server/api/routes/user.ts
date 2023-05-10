import Router from "@koa/router";
import { User } from "../../../Models/user";
import { UsernameChange } from "../../../Models/usernameChange";
import { isHeadStaff, isLoggedIn } from "../../middleware";

const userRouter = new Router();

userRouter.get("/", isLoggedIn, async (ctx) => {
    ctx.body = await ctx.state.user.getInfo();
});

userRouter.get("/mca", isLoggedIn, async (ctx) => {
    ctx.body = await ctx.state.user.getMCAInfo();
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
