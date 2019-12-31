import * as querystring from 'querystring'
import axios from 'axios'
import Router from 'koa-router';
import { Config } from "../../config"
import { User } from '../../CorsaceModels/user';
import { Eligibility } from '../../CorsaceModels/MCA_AYIM/eligibility';

const config = new Config();
const mode = [
    "standard",
    "taiko",
    "fruits",
    "mania"
]

class osuRouter {
    public router = new Router()

    constructor(redirect: string) {

        this.router.get("/", async (ctx, next) => {
            if (!ctx.state.user) {
                return ctx.body = { error: "Login through discord first!" };
            } else if (ctx.state.user.osu.accessToken !== "") {
                return ctx.redirect("back");
            }
            // Authorization
            ctx.redirect(`https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${config.osu.id}&redirect_uri=${encodeURIComponent(redirect + "/api/login/osu/callback")}&scope=identify`)
        })

        this.router.get("/callback", async (ctx) => {
            if (!ctx.query.code || ctx.query.error) {
                return ctx.redirect('/');
            }

            // Get token
            const data = querystring.stringify({
                grant_type: 'authorization_code',
                code: ctx.query.code,
                redirect_uri: redirect + "/api/login/osu/callback",
                client_id: config.osu.id,
                client_secret: config.osu.secret
            });

            let osuData;
            try {
                const res = await axios.post("https://osu.ppy.sh/oauth/token", data, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });
                osuData = res.data
            } catch (err) {
                ctx.body = { error: err };
            }

            // Input tokens
            let user: User = ctx.state.user
            user.osu.accessToken = osuData.access_token
            user.osu.refreshToken = osuData.refresh_token

            // Get user data
            try {
                const res = await axios.get("https://osu.ppy.sh/api/v2/me", {
                    headers: {
                        Authorization: `Bearer ${user.osu.accessToken}`
                    }
                })
                const userProfile = res.data
                user.osu.userID = userProfile.id
                user.osu.username = userProfile.username
                user.osu.avatar = "https://a.ppy.sh/" + userProfile.id
            } catch (err) {
                ctx.body = { error: err };
            }

            user.osu.dateAdded = user.osu.lastVerified = user.lastLogin = user.registered = new Date();
            user.mca = [];

            // MCA data
            const beatmaps = (await axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.osu.v1}&u=${user.osu.userID}`)).data
            if (beatmaps.length != 0) {
                for (let beatmap of beatmaps) {
                    if (!beatmap.version.includes("\'") && (beatmap.approved == 2 || beatmap.approved == 1)) {
                        // @ts-ignore
                        const date = new Date(beatmap.approved_date)
                        const year = date.getUTCFullYear();
                        let eligibility = await Eligibility.findOne({ relations: ["user"], where: { year: year, user: { id: user.id } }});
                        if (!eligibility) {
                            eligibility = new Eligibility();
                            eligibility.year = year
                            eligibility.user = user
                        }
                        
                        if (!eligibility[mode[beatmap.mode]]) {
                            eligibility[mode[beatmap.mode]] = true
                            await eligibility.save()
                            const i = user.mca.findIndex(e => e.year === year)
                            if (i === -1)
                                user.mca.push(eligibility)
                            else
                                user.mca[i] = eligibility
                        }
                    }
                }
            }

            await user.save();
            ctx.redirect('back');
        })
    }
}

export default osuRouter