<template>
    <div
        v-if="matchup"
        class="pickban"
    >
        <div class="pickban__streamTitle">
            {{ matchup.stage?.name.toUpperCase() || '' }}
        </div>
        <div class="pickban__mapName">
            <div class="pickban__diamond pickban__mapName__diamond" />
            PICKBAN
        </div>
        <div class="pickban__header">
            <div
                v-if="picking"
                class="pickban__header__picking"
                :style="{ color: nextTeamToPick?.abbreviation === matchup?.team1?.abbreviation ? '#5BBCFA' : '#F24141' }"
            >
                {{ nextTeamToPick?.abbreviation.toUpperCase() }} IS PICKING...
            </div>
        </div>
        <div
            v-if="matchup.team1"
            class="pickban__team1"
        >
            <div class="pickban__team1_abbreviation">
                {{ matchup.team1.abbreviation.toUpperCase() }}
            </div>
            <div class="pickban__team1_notMembers">
                <div
                    class="pickban__team1_avatar"
                    :style="{
                        'background-image': `url(${matchup.team1.avatarURL || '../../Assets/img/site/open/team/default.png'})`,
                    }"
                />
                <div class="pickban__team1_name">
                    {{ matchup.team1.name }}
                </div>
                <div class="pickban__team1_info pickban__team1_info--rank">
                    <div class="pickban__team1_info_header">
                        RANK AVG
                    </div>
                    <div class="pickban__team1_info_value">
                        {{ Math.round(matchup.team1.rank) }}
                    </div>
                </div>
                <div class="pickban__team1_info pickban__team1_info--bws">
                    <div class="pickban__team1_info_header">
                        BWS AVG
                    </div>
                    <div class="pickban__team1_info_value">
                        {{ Math.round(matchup.team1.BWS) }}
                    </div>
                </div>
                <div class="pickban__team1_score">
                    WINS
                    <svg
                        v-for="n in firstTo"
                        :key="n"
                        width="48"
                        height="22"
                        viewBox="0 0 48 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="pickban__team1_score__star"
                    >
                        <path
                            d="M 31 22 H 0 L 16 0 H 48 L 31 22 Z"
                            :fill="(matchup.sets?.[matchup.sets?.length - 1]?.team1Score || 0) >= n ? '#F24141FF' : '#F2414100'"
                            :stroke="(matchup.sets?.[matchup.sets?.length - 1]?.team1Score || 0) >= n ? '#F2414100' : '#F24141FF'"
                        />
                    </svg>
                </div>
            </div>
            <div class="pickban__team1_members">
                <div class="pickban__team1_members_member">
                    <div
                        class="pickban__team1_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${matchup.team1.captain.osuID})`,
                        }"
                    />
                    <div class="pickban__team1_members_member_username">
                        {{ matchup.team1.captain.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team1_members_member_BWS">
                        CAPTAIN
                    </div>
                    <div class="pickban__team1_members_member_captain" />
                </div>
                <div
                    v-for="member in matchup.team1.members.filter(member => !member.isCaptain)"
                    :key="member.ID"
                    class="pickban__team1_members_member"
                >
                    <div
                        class="pickban__team1_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${member.osuID})`,
                        }"
                    />
                    <div class="pickban__team1_members_member_username">
                        {{ member.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team1_members_member_BWS">
                        #{{ Math.round(member.rank) }}
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="matchup.team2"
            class="pickban__team2"
        >
            <div class="pickban__team2_abbreviation">
                {{ matchup.team2.abbreviation.toUpperCase() }}
            </div>
            <div class="pickban__team2_notMembers">
                <div
                    class="pickban__team2_avatar"
                    :style="{
                        'background-image': `url(${matchup.team2.avatarURL || '../../Assets/img/site/open/team/default.png'})`,
                    }"
                />
                <div class="pickban__team2_name">
                    {{ matchup.team2.name }}
                </div>
                <div class="pickban__team2_info pickban__team2_info--rank">
                    <div class="pickban__team2_info_header">
                        RANK AVG
                    </div>
                    <div class="pickban__team2_info_value">
                        {{ Math.round(matchup.team2.rank) }}
                    </div>
                </div>
                <div class="pickban__team2_info pickban__team2_info--bws">
                    <div class="pickban__team2_info_header">
                        BWS AVG
                    </div>
                    <div class="pickban__team2_info_value">
                        {{ Math.round(matchup.team2.BWS) }}
                    </div>
                </div>
                <div class="pickban__team2_score">
                    WINS
                    <svg
                        v-for="n in firstTo"
                        :key="n"
                        width="48"
                        height="22"
                        viewBox="0 0 48 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="pickban__team2_score__star"
                    >
                        <path
                            d="M 31 22 H 0 L 16 0 H 48 L 31 22 Z"
                            :fill="(matchup.sets?.[matchup.sets?.length - 1]?.team2Score || 0) >= n ? '#5BBCFAFF' : '#5BBCFA00'"
                            :stroke="(matchup.sets?.[matchup.sets?.length - 1]?.team2Score || 0) >= n ? '#5BBCFA00' : '#5BBCFAFF'"
                        />
                    </svg>
                </div>
            </div>
            <div class="pickban__team2_members">
                <div class="pickban__team2_members_member">
                    <div
                        class="pickban__team2_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${matchup.team2.captain.osuID})`,
                        }"
                    />
                    <div class="pickban__team2_members_member_username">
                        {{ matchup.team2.captain.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team2_members_member_BWS">
                        CAPTAIN
                    </div>
                    <div class="pickban__team2_members_member_captain" />
                </div>
                <div
                    v-for="member in matchup.team2.members.filter(member => !member.isCaptain)"
                    :key="member.ID"
                    class="pickban__team2_members_member"
                >
                    <div
                        class="pickban__team2_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${member.osuID})`,
                        }"
                    />
                    <div class="pickban__team2_members_member_username">
                        {{ member.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team2_members_member_BWS">
                        #{{ Math.round(member.rank) }}
                    </div>
                </div>
            </div>
        </div>
        <div class="pickban__picks">
            <BeatmapCard
                v-for="map in maps"
                :key="map.ID"
                :class="['pickban__pick', `pickban__pick--order-${map.order}`]"
                :beatmap="map.map"
                :mappool-slot="(map.map.slot?.acronym ?? '') + map.map.order"
                :status="map.status"
                :winner="map.scores.length > 0 ? calculateWinner(map) : undefined"
            />
            <BeatmapCard
                v-if="nextPickOrder"
                :class="['pickban__pick', `pickban__pick--order-${maps.length + 1}`]"
                :status="nextPickOrder.status"
            />
            <div
                v-for="index in placeholderCount"
                :key="index + placeholderOffset"
                :class="['pickban__pick', 'pickban__pick--placeholder', `pickban__pick--order-${index + placeholderOffset}`]"
            />
        </div>
        <style>{{ orderStyle }}</style>
    </div>
    <div v-else />
</template>

<script lang="ts">
import { Mixins, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import CentrifugeMixin from "../../../Assets/mixins/centrifuge";
import { MapStatus } from "../../../Interfaces/matchup";

import { Matchup as MatchupInterface, MatchupMap } from "../../../Interfaces/matchup";
import { MapOrder, MapOrderTeam } from "../../../Interfaces/stage";
import { ExtendedPublicationContext } from "centrifuge";

import BeatmapCard from "../../../Assets/components/open/PickBan/BeatmapCard.vue";

const streamModule = namespace("stream");

@Component({
    components: {
        BeatmapCard,
    },
    layout: "stream",
})
export default class Pickban extends Mixins(CentrifugeMixin) {

    @streamModule.State key!: string | null;
    @streamModule.State tournamentID!: number | null;

    matchup: MatchupInterface | null = null;
    loading = false;
    picking = false;

    get maps () {
        if (!this.matchup?.sets?.[this.matchup.sets.length - 1]?.maps)
            return [];

        const maps = this.matchup.sets[this.matchup.sets.length - 1].maps ?? [];

        return maps.sort((a, b) => a.order - b.order);
    }

    get pickedMaps () {
        return this.maps.filter(map => map.status === MapStatus.Picked);
    }

    get latestPick () {
        if (!this.pickedMaps.length)
            return null;

        return this.pickedMaps[this.pickedMaps.length - 1];
    }

    get nextPickOrder (): MapOrder | null {
        if (this.matchup?.sets?.length === 0 || !this.matchup?.sets?.[this.matchup.sets.length - 1]?.first)
            return null;

        const currentPickPosition = this.maps.length;

        if (currentPickPosition === this.mapOrder.length - 1)
            return null;

        const currentOrder = this.mapOrder[currentPickPosition];

        if (currentPickPosition === 0)
            return currentOrder;

        const previousPick = this.maps[currentPickPosition - 1];

        if (
            previousPick.status === MapStatus.Protected
            || previousPick.status === MapStatus.Banned
            || (previousPick.status === MapStatus.Picked && previousPick.scores.length > 0)
        )
            return currentOrder;

        return null;
    }

    get nextTeamToPick () {
        if (!this.latestPick)
            return null;

        if (this.pickedMaps.length % 2 === 0)
            return this.matchup?.sets?.[this.matchup.sets.length - 1]?.first;

        return this.matchup?.team1?.ID === this.matchup?.sets?.[this.matchup.sets.length - 1]?.first?.ID ? this.matchup?.team2 : this.matchup?.team1;
    }

    get mapOrder () {
        if (!this.matchup?.stage?.mapOrder && !this.matchup?.round?.mapOrder)
            return [];

        return this.matchup.stage?.mapOrder ?? this.matchup.round?.mapOrder ?? [];
    }

    get firstTo () {
        return this.mapOrder.filter(p => p.status === MapStatus.Picked).length / 2 + 1;
    }

    get placeholderCount () {
        return this.mapOrder.length - this.maps.length - (this.nextPickOrder ? 1 : 0);
    }

    get placeholderOffset () {
        return this.maps.length + (this.nextPickOrder ? 1 : 0);
    }

    get orderStyle () {
        let style = "";

        let team1Count = 0;
        let team2Count = 0;

        for (const orderEl of this.mapOrder) {
            style += `.pickban__pick--order-${orderEl.order} {grid-area: ${this.gridRowCalc(orderEl.team)} / `;

            if (orderEl.team === MapOrderTeam.Team1) {
                style += `${++team1Count};}\n`;
            }

            if (orderEl.team === MapOrderTeam.Team2) {
                style += `${++team2Count};}\n`;
            }
        }

        return style;
    }

    gridRowCalc (teamOrder: MapOrderTeam) {
        if (this.matchup?.sets?.[this.matchup.sets.length - 1]?.first?.ID === this.matchup?.team2?.ID)
            return 2 - teamOrder;
        // Default as if team1 is roll winner
        return teamOrder + 1;
    }

    calculateWinner (map: MatchupMap) {
        let team1Score = 0;
        let team2Score = 0;

        if (map.scores) {
            for (const score of map.scores) {
                if (score.teamID === this.matchup?.team1?.ID)
                    team1Score += score.score;
                if (score.teamID === this.matchup?.team2?.ID)
                    team2Score += score.score;
            }
        }

        return team1Score > team2Score ? "red" : "blue";
    }

    async mounted () {
        this.loading = true;
        const matchupID = this.$route.query.ID;
        if (typeof matchupID !== "string")
            return;

        const { data } = await this.$axios.get<{ matchup: MatchupInterface }>(`/api/matchup/${matchupID}`);
        if (!data.success)
            return;

        this.matchup = data.matchup;

        this.loading = false;

        await this.initCentrifuge(`matchup:${this.matchup.ID}`);
    }

    handleData (ctx: ExtendedPublicationContext) {
        console.log("publication", ctx.channel, ctx.data);

        if (!ctx.channel.startsWith("matchup:"))
            return;
        const matchupID = parseInt(ctx.channel.split(":")[1]);
        if (matchupID !== this.matchup?.ID)
            return;

        switch (ctx.data.type) {
            case "matchFinished": {
                this.matchup.team1Score = ctx.data.team1Score;
                this.matchup.team2Score = ctx.data.team2Score;
                this.matchup.sets![this.matchup.sets!.length - 1].team1Score = ctx.data.setTeam1Score;
                this.matchup.sets![this.matchup.sets!.length - 1].team2Score = ctx.data.setTeam2Score;

                const order = ctx.data.map.order;
                const index = this.matchup.sets?.[this.matchup.sets?.length - 1].maps?.findIndex(map => map.order === order);

                if (index && index > -1) {
                    const mappoolMapData = ctx.data.map.map;
                    const mappool = this.matchup.stage?.mappool?.find(m => m.slots.flatMap(s => s.maps).find(map => map.ID === mappoolMapData.ID));
                    if (mappool) {
                        const slot = mappool.slots.find(s => s.maps.find(map => map.ID === mappoolMapData.ID));
                        if (slot) {
                            const mappoolMap = slot.maps.find(map => map.ID === mappoolMapData.ID);
                            if (mappoolMap) {
                                mappoolMap.slot = slot; // mappool maps don't contain slot as they are children of the slot object
                                ctx.data.map.map = mappoolMap;
                            }
                        }
                    }
                    this.matchup.sets![this.matchup.sets!.length - 1].maps!.splice(index, 1, ctx.data.map);
                }

                break;
            }
            case "beatmap": {
                const beatmapData = ctx.data;
                const mappool = this.matchup.stage?.mappool?.find(m => m.slots.flatMap(s => s.maps).find(map => map.beatmap?.ID === beatmapData.beatmapID));
                if (!mappool)
                    break;
                const slot = mappool.slots.find(s => s.maps.find(map => map.beatmap?.ID === beatmapData.beatmapID));
                if (!slot)
                    break;
                const mappoolMap = slot.maps.find(map => map.beatmap?.ID === beatmapData.beatmapID);
                if (!mappoolMap)
                    break;
                mappoolMap.slot = slot; // mappool maps don't contain slot as they are children of the slot object

                const lastSetMaps = this.matchup.sets?.[this.matchup.sets?.length - 1].maps;
                console.log(lastSetMaps);
                if (!lastSetMaps)
                    break;

                // Current last map is still an unconfirmed pick
                if (lastSetMaps[lastSetMaps.length - 1]?.ID === -1) {
                    this.matchup.sets![this.matchup.sets!.length - 1].maps![lastSetMaps.length - 1].map = mappoolMap;
                    break;
                }
                
                this.matchup.sets![this.matchup.sets!.length - 1].maps?.push({
                    ID: -1,
                    order: lastSetMaps.length + 1,
                    map: mappoolMap,
                    status: MapStatus.Picked,
                    scores: [],
                });
                break;
            }
            case "selectMap": {
                const mappoolMapData = ctx.data.map.map;
                const mappool = this.matchup.stage?.mappool?.find(m => m.slots.flatMap(s => s.maps).find(map => map.ID === mappoolMapData.ID));
                if (mappool) {
                    const slot = mappool.slots.find(s => s.maps.find(map => map.ID === mappoolMapData.ID));
                    if (slot) {
                        const mappoolMap = slot.maps.find(map => map.ID === mappoolMapData.ID);
                        if (mappoolMap) {
                            mappoolMap.slot = slot; // mappool maps don't contain slot as they are children of the slot object
                            ctx.data.map.map = mappoolMap;
                        }
                    }
                }
                this.matchup.sets?.[this.matchup.sets?.length - 1].maps?.push(ctx.data.map);
                break;
            }
            case "first": {
                const first = ctx.data.first === this.matchup.team1?.ID ? this.matchup.team1 : this.matchup.team2;
                if (!this.matchup.sets || this.matchup.sets.length === 0)
                    this.matchup.sets = [{
                        ID: 0,
                        order: 1,
                        first,
                        maps: [],
                        team1Score: 0,
                        team2Score: 0,
                    }];
                else
                    this.$set(this.matchup.sets[this.matchup.sets.length - 1], "first", first); // In order to make the computed properties watchers work 
                break;
            }
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

.pickban {
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

    &__header {
        position: fixed;
        width: 100%;
        height: 86px;
        top: 122px;

        &__picking {
            position: absolute;
            top: 16px;
            left: 44px;
            font-size: 40px;
            font-weight: bold;
        }
    }

    &__team1, &__team2 {

        &_name {
            font-size: 32px;
            font-weight: bold;
            position: fixed;
            left: 16px;
        }

        &_avatar {
            position: fixed;
            width: 432px;
            height: 107px;
            left: 0;
            background-size: cover;
            background-position: center;
        }

        &_notMembers {
            animation-name: fade1;
        }

        &_abbreviation {
            font-family: $font-swis721;
            font-weight: bold;
            font-size: 27px;
            position: fixed;
            width: 432px;
            height: 51px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #E0E0E0;
            left: 0;
            letter-spacing: 1.62px;
        }

        &_notMembers, &_members {
            animation-duration: 32s;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
        }

        &_info {
            position: fixed;
            font-family: $font-swis721;
            height: 102px;
            width: 150px;
            white-space: nowrap;

            &_header {
                padding: 3px 7px;
                background-color: $open-red;
                font-size: 16px;
                font-weight: bold;
                color: #1D1D1D;
                width: fit-content;
                position: absolute;
                top: 0;
                left: 0;
            }

            &_value {
                font-size: 64px;
                font-weight: bold;
                font-style: italic;
                position: absolute;
                bottom: 0;
                right: 0;
                color: #EBEBEB;
            }

            &--rank {
                left: 16px;
            }

            &--bws {
                left: 238px;
            }
        }

        &_score {
            position: fixed;
            left: 16px;
            font-size: 12px;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 11px;
        }

        &_members {
            position: fixed;
            width: 395px;
            left: 18px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 17px;
            animation-name: fade2;

            &_member {
                position: relative;
                height: 66px;
                width: 189px;

                border: 1px solid #767676;
                background-color: #E0E0E0;
                color: #1D1D1D;
                font-size: 14px;
                font-weight: bold;
                text-align: right;

                overflow: hidden;

                &_avatar {
                    height: 100%;
                    width: 45px;
                    position: absolute;
                    left: 0;
                    top: 0;
                    background-size: cover;
                    background-position: center;
                }

                &_username {
                    padding-right: 4px;
                    padding-top: 4px;
                    padding-bottom: 4px;
                }

                &_BWS {
                    padding-right: 4px;
                    font-size: 12px;
                    background-color: $open-red;
                    color: #EBEBEB;
                }

                &_captain {
                    background-image: url("../../../Assets/img/site/open/team/captainBlack.svg");
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    width: 17px;
                    height: 12px;
                    position: absolute;
                    right: 4px;
                    bottom: 4px;
                }
            }
        }
    }

    &__team1 {
        color: #F24141;

        &_avatar {
            top: 259px;
        }

        &_name {
            top: 382px;
        }

        &_abbreviation {
            top: 208px;
        }

        &_score {
            top: 444px;
        }

        &_info {
            top: 512px;
        }

        &_members {
            top: 288px;
        }
    }

    &__team2 {
        color: #5BBCFA;

        &_avatar {
            top: 695px;
        }

        &_abbreviation {
            top: 644px;
        }

        &_score {
            top: 880px;
        }

        &_info {
            top: 948px;
        }

        &_members {
            top: 724px;
        }

        &_name {
            top: 818px;
        }
    }

    &__picks {
        position: absolute;
        top: 208px;
        left: 456px;

        width: 1432px;
        height: 872px;

        display: grid;
        grid-template: repeat(2, 435px) / repeat(9, 144px);

        gap: 2px 17px;
    }

    &__pick {
        &--placeholder {
            background-color: #D9D9D9;
            opacity: 0.22;
        }
    }
}
</style>
