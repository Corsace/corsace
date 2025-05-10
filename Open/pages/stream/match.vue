<template>
    <div
        v-if="matchup"
        class="matchup"
    >
        <div class="matchup__streamTitle">
            {{ matchup.stage?.name.toUpperCase() || '' }}
        </div>
        <div class="matchup__mapName">
            <div class="matchup__diamond matchup__mapName__diamond" />
            MATCH
        </div>
        <div
            v-if="matchup.team1"
            class="matchup__team1"
        >
            <div class="matchup__team1_abbreviation">
                {{ matchup.team1.abbreviation.toUpperCase() }}
            </div>
            <div
                class="matchup__team1_avatar"
                :style="{
                    'background-image': `url(${matchup.team1.avatarURL || require('../../../Assets/img/site/open/team/default.png')})`,
                }"
            />
            <div class="matchup__team1_name">
                {{ matchup.team1.name }}
            </div>
            <div class="matchup__team1_score">
                WINS
                <svg
                    v-for="n in firstTo"
                    :key="n"
                    width="48"
                    height="22"
                    viewBox="0 0 48 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="matchup__team1_score__star"
                >
                    <path
                        d="M 31 22 H 0 L 16 0 H 48 L 31 22 Z"
                        :fill="displayedTeam1Score >= n ? '#F24141FF' : '#F2414100'"
                        :stroke="displayedTeam1Score >= n ? '#F2414100' : '#F24141FF'"
                    />
                </svg>
            </div>
            <div class="matchup__team1_score_header">
                SCORE
            </div>
        </div>
        <div
            v-if="latestMap"
            class="matchup__beatmap"
        >
            <div class="matchup__beatmap__header">
                <div
                    class="matchup__beatmap__name"
                    :style="{color: slotMod}"
                >
                    <div
                        class="matchup__diamond matchup__beatmap__name__diamond"
                        :style="{backgroundColor: slotMod}"
                    />
                    {{ stageOrRound?.mappool.flatMap(m => m.slots).find(s => s.maps.some(m => m.ID === latestMap?.ID))?.acronym.toUpperCase() }}{{ latestMap.order }}
                </div>
                <div class="matchup__beatmap__picked">
                    PICKED BY {{ pickedBy }}
                </div>
            </div>
            <div
                class="matchup__beatmap__info"
                :style="{ backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 50%), url(${latestMap.customBeatmap?.background || `https://assets.ppy.sh/beatmaps/${latestMap?.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg`})` }"
            >
                <div class="matchup__beatmap__info1">
                    <div class="matchup__beatmap__info1__title">
                        {{ latestMap.beatmap?.beatmapset?.title }}
                    </div>
                    <div class="matchup__beatmap__info1__artist">
                        {{ latestMap.beatmap?.beatmapset?.artist }}
                    </div>
                    <div class="matchup__beatmap__info1_line" />
                    <div class="matchup__beatmap__info1_text matchup__beatmap__info1_text_mapper">
                        <div class="matchup__beatmap__info1_text--mapper">
                            MAPPER
                        </div>
                        <div class="matchup__beatmap__info1_text--truncated">
                            {{ latestMap.customMappers?.map(mapper => mapper.osu.username).join(", ") || latestMap.beatmap?.beatmapset?.creator?.osu.username || '' }}
                        </div>
                    </div>
                    <div class="matchup__beatmap__info1_text matchup__beatmap__info1_text_difficulty">
                        <div class="matchup__beatmap__info1_text--difficulty">
                            DIFFICULTY
                        </div>
                        <div class="matchup__beatmap__info1_text--truncated">
                            {{ latestMap.beatmap?.difficulty || latestMap.customBeatmap?.difficulty || '' }}
                        </div>
                    </div>
                </div>
                <MappoolMapStats
                    class="matchup__beatmap__info2"
                    :mappool-map="latestMap"
                />
            </div>
        </div>
        <div
            v-if="matchup.team2"
            class="matchup__team2"
        >
            <div class="matchup__team2_abbreviation">
                {{ matchup.team2.abbreviation.toUpperCase() }}
            </div>
            <div
                class="matchup__team2_avatar"
                :style="{
                    'background-image': `url(${matchup.team2.avatarURL || require('../../../Assets/img/site/open/team/default.png')})`,
                }"
            />
            <div class="matchup__team2_name">
                {{ matchup.team2.name }}
            </div>
            <div class="matchup__team2_score">
                <svg
                    v-for="n in firstTo"
                    :key="n"
                    width="48"
                    height="22"
                    viewBox="0 0 48 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="matchup__team2_score__star"
                >
                    <path
                        d="M 16 22 H 48 L 31 0 H 0.684986 L 16 22 Z"
                        :fill="displayedTeam2Score >= n ? '#5BBCFAFF' : '#5BBCFA00'"
                        :stroke="displayedTeam2Score >= n ? '#5BBCFA00' : '#5BBCFAFF'"
                    />
                </svg>
                WINS
            </div>
            <div class="matchup__team2_score_header">
                SCORE
            </div>
        </div>
    </div>
    <div v-else />
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import MappoolMapStats from "../../../Assets/components/open/MappoolMapStats.vue";

import { MapStatus, Matchup as MatchupInterface } from "../../../Interfaces/matchup";
import { MapOrderTeam, Stage } from "../../../Interfaces/stage";
import { Round } from "../../../Interfaces/round";
import { freemodRGB, freemodButFreerRGB, modsToRGB } from "../../../Interfaces/mods";
import { Centrifuge, ExtendedPublicationContext, Subscription } from "centrifuge";
import { MappoolMap } from "../../../Interfaces/mappool";

const streamModule = namespace("stream");

@Component({
    components: {
        MappoolMapStats,
    },
    layout: "stream",
})
export default class Match extends Vue {

    @streamModule.State key!: string | null;
    @streamModule.State tournamentID!: number | null;

    centrifuge: Centrifuge | null = null;
    matchupChannel: Subscription | null = null;

    matchup: MatchupInterface | null = null;
    latestMap: MappoolMap | null = null;
    loading = false;

    freezeTeamScores = false;
    displayedTeam1Score = 0;
    displayedTeam2Score = 0;

    get stageOrRound (): Round | Stage | null {
        return this.matchup?.stage ?? this.matchup?.round ?? null;
    }

    get pickedMaps () {
        if (!this.matchup?.sets?.[this.matchup.sets.length - 1]?.maps)
            return [];

        return this.matchup.sets[this.matchup.sets.length - 1].maps!.filter(map => map.status === MapStatus.Picked).sort((a, b) => a.order - b.order);
    }

    get pickedBy () {
        if (!this.latestMap)
            return null;

        // TODO: support for sets
        const pickOrder = this.mapOrder[(this.matchup?.sets?.[this.matchup.sets.length - 1]?.order ?? 1) - 1]?.order?.filter(p => p.status === MapStatus.Picked);
        if (!pickOrder)
            return null;

        const currentOrder = this.pickedMaps.length > pickOrder.length ? null : pickOrder[this.pickedMaps.length];
        const first = this.matchup?.sets?.[this.matchup.sets.length - 1]?.first?.abbreviation.toUpperCase();
        const second = this.matchup?.team1?.ID === this.matchup?.sets?.[this.matchup.sets.length - 1]?.first?.ID ? this.matchup?.team2?.abbreviation.toUpperCase() : this.matchup?.team2?.ID === this.matchup?.sets?.[this.matchup.sets.length - 1]?.first?.ID ? this.matchup?.team1?.abbreviation.toUpperCase() : null;
        const winning = this.matchup?.team1Score && this.matchup?.team2Score ? this.matchup?.team1Score > this.matchup?.team2Score ? this.matchup?.team1?.abbreviation.toUpperCase() : this.matchup?.team2?.abbreviation.toUpperCase() : null;
        const losing = this.matchup?.team1Score && this.matchup?.team2Score ? this.matchup?.team1Score > this.matchup?.team2Score ? this.matchup?.team2?.abbreviation.toUpperCase() : this.matchup?.team1?.abbreviation.toUpperCase() : null;

        return currentOrder?.team === MapOrderTeam.Team1 ? first : currentOrder?.team === MapOrderTeam.Team2 ? second : currentOrder?.team === MapOrderTeam.TeamLoser ? losing ?? second : currentOrder?.team === MapOrderTeam.TeamWinner ? winning ?? first : null;
    }

    get mapOrder () {
        if (!this.stageOrRound)
            return [];

        return this.stageOrRound.mapOrder
            ?.map(mapOrder => mapOrder.set)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(set => ({
                set,
                order: this.stageOrRound?.mapOrder?.filter(mapOrder => mapOrder.set === set),
            })) ?? [];
    }

    get firstTo () {
        return (this.mapOrder[(this.matchup?.sets?.[this.matchup.sets.length - 1]?.order ?? 1) - 1]?.order?.filter(p => p.status === MapStatus.Picked).length ?? 0) / 2 + 1;
    }

    get slotMod (): string {
        const slot = this.stageOrRound?.mappool
            .flatMap(m => m.slots)
            .find(s => s.maps.some(m => m.ID === this.latestMap?.ID));

        if (!slot)
            return this.RGBValuesToRGBCSS(modsToRGB(0));

        if (slot.allowedMods === null && slot.userModCount === null && slot.uniqueModCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreerRGB);

        if (slot.userModCount !== null || slot.uniqueModCount !== null)
            return this.RGBValuesToRGBCSS(freemodRGB);

        return this.RGBValuesToRGBCSS(modsToRGB(slot.allowedMods));
    }

    RGBValuesToRGBCSS (values: [number, number, number]) {
        return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
    }

    async mounted () {
        this.loading = true;
        const matchupID = this.$route.query.ID;
        if (typeof matchupID !== "string")
            return;

        const { data: centrifugoURLData } = await this.$axios.get<{ url: string }>("/api/centrifugo/publicUrl");
        if (!centrifugoURLData.success) {
            alert("Couldn't get centrifugo URL");
            console.log(centrifugoURLData.error);
            return;
        }

        const centrifugeUrl = new URL(`${centrifugoURLData.url}/connection/websocket`, window.location.href);
        centrifugeUrl.protocol = centrifugeUrl.protocol.replace("http", "ws");
        const centrifuge = new Centrifuge(centrifugeUrl.href, {});

        centrifuge.on("connecting", (ctx) => {
            console.log("connecting", ctx);
        });

        centrifuge.on("error", (err) => {
            console.error("error", err);
        });

        centrifuge.on("connected", (ctx) => {
            console.log("connected", ctx);
        });

        centrifuge.connect();

        this.centrifuge = centrifuge;

        const { data } = await this.$axios.get<{
            matchup: MatchupInterface;
        }>(`/api/matchup/${matchupID}`);
        if (!data.success)
            return;

        this.matchup = data.matchup;

        this.matchupChannel = this.centrifuge.newSubscription(`matchup:${matchupID}`);

        this.matchupChannel.on("error", (err) => {
            alert("Error in console for matchup channel subscription");
            console.error("error", err);
        });

        this.matchupChannel.on("unsubscribed", (ctx) => {
            if (ctx.code === 102)
                alert("Couldn't find matchup channel");
            else if (ctx.code === 103)
                alert("Unauthorized to subscribe to matchup channel");
            else if (ctx.code !== 0) {
                alert("Error in console for matchup channel subscription");
                console.error("unsubscribed", ctx);
            } else
                console.log("unsubscribed", ctx);
        });

        this.matchupChannel.on("subscribed", (ctx) => {
            console.log("subscribed", ctx);
        });

        this.matchupChannel.on("publication", (ctx) => this.handleUpdate(ctx));

        this.matchupChannel.subscribe();

        if (this.matchup?.mp) {
            const { data: pulseData } = await this.$axios.get<{
                pulse: boolean;
                beatmapID: number;
                team1Score: number;
                team2Score: number;
                sets: { team1Score: number, team2Score: number }[];
            }>(`/api/matchup/${this.matchup.ID}/bancho/pulseMatch`);
            if (!pulseData.success || !pulseData.pulse)
                return;
            this.latestMap = this.stageOrRound?.mappool
                .flatMap(m => m.slots)
                .flatMap(s => s.maps)
                .find(m => m.beatmap?.ID === pulseData.beatmapID) ?? null;
            const lastSet = pulseData.sets.length > 0 ? pulseData.sets[pulseData.sets.length - 1] : null;
            this.matchup.team1Score = lastSet ? lastSet.team1Score : pulseData.team1Score;
            this.matchup.team2Score = lastSet ? lastSet.team2Score : pulseData.team2Score;
        }
        this.loading = false;
    }

    handleUpdate (ctx: ExtendedPublicationContext) {
        console.log("publication", ctx);

        if (!ctx.channel.startsWith("matchup:"))
            return;
        const matchupID = parseInt(ctx.channel.split(":")[1]);
        if (matchupID !== this.matchup?.ID)
            return;

        switch (ctx.data.type) {
            case "first":
                this.$set(this.matchup, "first", ctx.data.first === this.matchup.team1?.ID ? this.matchup.team1 : this.matchup.team2); // In order to make the computed properties watchers work
                break;
            case "beatmap": {
                const ID = ctx.data.beatmapID;
                this.latestMap = this.stageOrRound?.mappool
                    .flatMap(m => m.slots)
                    .flatMap(s => s.maps)
                    .find(m => m.beatmap?.ID === ID) ?? null;
                break;
            }
            case "matchFinished":
                this.matchup.team1Score = ctx.data.setTeam1Score;
                this.matchup.team2Score = ctx.data.setTeam2Score;
                break;
            case "ipcState":
                this.freezeTeamScores = ctx.data.ipcState === "Playing";
                break;
        }
    }

    @Watch("matchup.team1Score")
    @Watch("matchup.team2Score")
    @Watch("freezeTeamScores")
    refreshTeamScores () {
        if (!this.freezeTeamScores) {
            this.displayedTeam1Score = this.matchup?.team1Score ?? 0;
            this.displayedTeam2Score = this.matchup?.team2Score ?? 0;
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@keyframes fade1 {
    0%      {opacity: 1}
    25%     {opacity: 1}
    50%     {opacity: 0}
    75%     {opacity: 0}
    100%    {opacity: 1}
}

@keyframes fade2 {
    0%      {opacity: 0}
    25%     {opacity: 0}
    50%     {opacity: 1}
    75%     {opacity: 1}
    100%    {opacity: 0}
}

.matchup {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    font-family: $font-ggsans;

    &__diamond {
        transform: rotate(45deg);
    }

    &__streamTitle {
        position: fixed;
        top: 8px;
        left: 10px;
        font-family: $font-swis721;
        font-size: 40px;
        color: #1d1d1d;
    }

    &__mapName {
        position: fixed;
        top: 70px;
        left: 16px;
        font-family: $font-swis721;
        font-weight: bold;
        font-size: 40px;
        color: #fff;

        display: flex;
        justify-content: center;
        align-items: center;
        gap: 13px;

        &__diamond {
            width: 10px;
            height: 10px;
            background-color: white;
        }
    }

    &__beatmap {
        &__name {
            position: fixed;
            bottom: 157px;
            left: 711px;
            font-size: 22px;
            font-weight: bold;

            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;

            &__diamond {
                width: 5px;
                height: 5px;
            }
        }

        &__picked {
            position: fixed;
            bottom: 157px;
            right: 711px;
            font-size: 22px;
            font-weight: bold;
        }

        &__info {
            background-size: cover;
            background-position: center;
            position: fixed;
            bottom: 0;
            width: 524px;
            height: 153px;
            left: 698px;
            right: 698px;
            overflow: hidden;

            &1, &2 {
                animation-duration: 16s;
                animation-iteration-count: infinite;
                animation-timing-function: ease-in-out;
            }

            &1 {
                color: #1D1D1D;
                animation-name: fade1;

                &__title, &__artist {
                    text-align: right;
                    width: 100%;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }

                &__title {
                    position: absolute;
                    top: 11px;
                    right: 13px;
                    font-size: 32px;
                    font-weight: bold;
                }

                &__artist {
                    position: absolute;
                    top: 53px;
                    right: 13px;
                    font-size: 22px;
                    font-weight: bold;
                    font-style: italic;
                }

                &_line {
                    position: absolute;
                    border: 1px solid $open-red;
                    width: 301px;
                    right: 0;
                    top: 92px;
                }

                &_text {
                    position: absolute;
                    bottom: 9px;
                    display: flex;
                    flex-direction: column;

                    &_mapper {
                        right: 13px;
                    }

                    &_difficulty {
                        right: 144px;
                    }

                    &--mapper, &--difficulty {
                        font-family: $font-swis721;
                        font-weight: 700;
                        padding: 1.75px 3.5px;
                        font-size: 12px;
                        vertical-align: middle;

                    }

                    &--mapper {
                        background-color: $open-red;
                        color: $open-dark;
                    }

                    &--difficulty {
                        background-color: $open-dark;
                        color: #EBEBEB;
                    }

                    &--truncated {
                        max-width: 131px;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        text-shadow: 0 0 3px black;

                        font-size: 16px;
                    }
                }
            }

            &2 {
                animation-name: fade2;
            }
        }
    }

    &__team1_abbreviation, &__team2_abbreviation {
        font-family: $font-swis721;
        font-weight: bold;
        font-size: 27px;
        color: #1d1d1d;
        position: fixed;
        bottom: 195px;
        letter-spacing: -1.08px;
    }

    &__team1_avatar, &__team2_avatar {
        position: fixed;
        bottom: 0;
        width: 161px;
        height: 189px;
        background-size: cover;
        background-position: center;
        border: 2px solid $open-red;
    }

    &__team1_name, &__team2_name {
        position: fixed;
        bottom: 151px;
        font-size: 41px;
        font-weight: bold;
    }

    &__team1_score, &__team2_score {
        position: fixed;
        bottom: 119px;
        font-size: 12px;
        font-weight: bold;

        display: flex;
        gap: 15px;
    }

    &__team1_score_header, &__team2_score_header {
        position: fixed;
        bottom: 39px;
        font-size: 12px;
        font-weight: bold;
    }

    &__team1 {
        &_abbreviation {
            left: 55px;
        }

        &_avatar {
            left: 0;
        }

        &_name {
            left: 188px;
            color: #F24141;
        }

        &_score {
            left: 188px;
        }

        &_score_header {
            left: 188px;
        }
    }

    &__team2 {
        &_abbreviation {
            right: 55px;
        }

        &_avatar {
            right: 0;
        }

        &_name {
            right: 188px;
            color: #5BBCFA;
        }

        &_score {
            right: 188px;
        }

        &_score_header {
            right: 188px;
        }
    }
}

.mappool_map_stats {
    mix-blend-mode: normal;
    color: black;
    font-weight: bold;
    background-image: none;
    width: 275px;
    height: 100%;
    position: absolute;
    right: 0;
}
</style>
