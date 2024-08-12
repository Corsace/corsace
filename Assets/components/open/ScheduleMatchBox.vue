<template>
    <div 
        v-if="matchupSync"
        class="schedule_matchbox"
    >
        <div
            v-if="staffInfo?.userRoles.includes(0)"
            class="schedule_matchbox__staff_assignment"
            :class="{ 'schedule_matchbox__staff_assignment--active': staffAssign }"
            @click="staffAssign = !staffAssign"
        />
        <div
            v-if="staffAssign && staffInfo?.userRoles.includes(0)"
            class="schedule_matchbox__staff_box"
        >
            <div class="schedule_matchbox__staff_box__section">
                <div class="schedule_matchbox__staff_box__section__title">
                    REFEREE:
                </div>
                <select
                    v-model="matchReferee"
                    return-object
                    class="schedule_matchbox__staff_box__section__content"
                    @change="selectStaff('referee', matchReferee)"
                >
                    <option
                        disabled
                        :value="null"
                    >
                        ...
                    </option>
                    <option
                        v-for="staff in referees"
                        :key="staff.ID"
                        :value="staff"
                    >
                        {{ staff.username }}
                    </option>
                </select>
            </div>
            <div class="schedule_matchbox__staff_box__section">
                <div class="schedule_matchbox__staff_box__section__title">
                    STREAM:
                </div>
                <select
                    v-model="matchStreamer"
                    return-object
                    class="schedule_matchbox__staff_box__section__content"
                    @change="selectStaff('stream', matchStreamer)"
                >
                    <option
                        disabled
                        :value="null"
                    >
                        ...
                    </option>
                    <option
                        v-for="staff in streamers"
                        :key="staff.ID"
                        :value="staff"
                    >
                        {{ staff.username }}
                    </option>
                </select>
            </div>
            <div class="schedule_matchbox__staff_box__section">
                <div class="schedule_matchbox__staff_box__section__title">
                    COMM:
                </div>
                <select
                    v-model="matchCommentators"
                    multiple
                    return-object
                    class="schedule_matchbox__staff_box__section__content"
                    @change="selectStaff('commentator', matchCommentators)"
                >
                    <option
                        v-for="staff in commentators"
                        :key="staff.ID"
                        :value="staff"
                    >
                        {{ staff.username }}
                    </option>
                </select>
            </div>
            <div class="triangle schedule_matchbox__staff_box__triangle" />
        </div>
        <div class="schedule_matchbox_date">
            <div
                v-if="matchupSync.potential"
                class="schedule_matchbox__potential"
            >
                {{ $t("open.schedule.potential") }}
            </div>
            <div class="schedule_matchbox_date__ID">
                ID: {{ matchupSync.matchID }}
            </div>
            <div class="schedule_matchbox_date__month">
                {{ formatDate(matchupSync.date) }}
            </div>
            <OpenMatchupTime
                :date="matchupSync.date"
                timezone="UTC"
            />
        </div>
        <div class="schedule_matchbox_teams">
            <ScheduleMatchBoxTeam :team="matchupSync.teams?.[0]" />
            <div class="schedule_matchbox_teams__vs">
                <div>VS</div>
                <div>
                    {{ !matchupSync.forfeit ? matchupSync.team1Score : matchupSync.team1Score < matchupSync.team2Score ? "FF" : 0 }}-{{ !matchupSync.forfeit ? matchupSync.team2Score : matchupSync.team1Score > matchupSync.team2Score ? "FF" : 0 }}
                </div>
            </div>
            <ScheduleMatchBoxTeam :team="matchupSync.teams?.[1]" />
        </div>
        <div class="schedule_matchbox_links">
            <IconButton
                v-if="matchupSync.vod"
                :link="matchupSync.vod"
            >
                <img 
                    class="schedule_matchbox_links__button__twitch"
                    src="../../img/social/twitch-light.svg"
                >
            </IconButton>
            <div 
                v-else
                class="schedule_matchbox_links__placeholder"
            />
            <IconButton
                v-if="matchupSync.mp"
                :link="`https://osu.ppy.sh/mp/${matchupSync.mp}`"
            >
                <img 
                    class="schedule_matchbox_links__button__twitch"
                    src="../../img/site/open/link.svg"
                >
            </IconButton>
            <div 
                v-else
                class="schedule_matchbox_links__placeholder"
            />
            <div
                v-if="matchupSync.referee"
                class="schedule_matchbox_links__staff"
            >
                REF: {{ matchupSync.referee.username }}
            </div>
            <div
                v-for="commentator in matchupSync.commentators"
                :key="commentator.ID"
                class="schedule_matchbox_links__staff"
            >
                {{ commentator.username }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { MatchupList } from "../../../Interfaces/matchup";
import { OpenStaffInfo, BaseStaffMember } from "../../../Interfaces/staff";
import { TournamentRoleType, Tournament } from "../../../Interfaces/tournament"; 

import IconButton from "./IconButton.vue";
import OpenMatchupTime from "./OpenMatchupTime.vue";
import ScheduleMatchBoxTeam from "./ScheduleMatchBoxTeam.vue";

const openModule = namespace("open");

@Component({
    components: {
        IconButton,
        OpenMatchupTime,
        ScheduleMatchBoxTeam,
    },
})
export default class ScheduleMatchBox extends Vue {
    @PropSync("matchup", { default: null }) matchupSync!: MatchupList | null;

    @openModule.State staffInfo!: OpenStaffInfo | null;
    @openModule.State tournament!: Tournament | null;

    staffAssign = false;

    matchReferee: BaseStaffMember | null = null;
    matchCommentators: BaseStaffMember[] = [];
    matchStreamer: BaseStaffMember | null = null;

    get referees () {
        return this.staffInfo?.staff
            .filter(s => s.roleType === TournamentRoleType.Referees || s.roleType === TournamentRoleType.Organizer)
            .sort((a, b) => a.roleType - b.roleType)
            .flatMap(s => s.users)
            .filter((s, i, a) => a.findIndex(u => u.ID === s.ID) === i);
    }

    get commentators () {
        return this.staffInfo?.staff
            .filter(s => s.roleType === TournamentRoleType.Commentators || s.roleType === TournamentRoleType.Organizer)
            .sort((a, b) => a.roleType - b.roleType)
            .flatMap(s => s.users)
            .filter((s, i, a) => a.findIndex(u => u.ID === s.ID) === i);
    }

    get streamers () {
        return this.staffInfo?.staff
            .filter(s => s.roleType === TournamentRoleType.Streamers || s.roleType === TournamentRoleType.Organizer)
            .sort((a, b) => a.roleType - b.roleType)
            .flatMap(s => s.users)
            .filter((s, i, a) => a.findIndex(u => u.ID === s.ID) === i);
    }

    @Watch("matchupSync")
    onMatchupSyncChange () {
        this.matchReferee = this.matchupSync?.referee ?? null;
        this.matchCommentators = this.matchupSync?.commentators ?? [];
        this.matchStreamer = this.matchupSync?.streamer ?? null;
    }

    async selectStaff (roleType: "referee" | "stream" | "commentator", staff: BaseStaffMember | BaseStaffMember[] | null) {
        if (!this.tournament || !this.matchupSync) {
            alert("Missing tournament or matchup information.");
            return;
        }

        if (!staff) {
            alert("Invalid staff selection.");
            return;
        }

        const { data } = await this.$axios.post<{ matchup: MatchupList }>(`/api/matchup/assignStaff`, {
            tournamentID: this.tournament?.ID,
            matchupID: this.matchupSync?.ID,
            roleType: roleType === "referee" ? TournamentRoleType.Referees : roleType === "stream" ? TournamentRoleType.Streamers : TournamentRoleType.Commentators,
            staff: Array.isArray(staff) ? staff.map(s => s.ID) : staff.ID,
        });

        if (!data.success) {
            alert("Failed to update staff. Check console for information.");
            console.error(data.error);
            return;
        }

        this.$emit("update:matchup");
    }

    formatDate (date: Date): string {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = date.getUTCDate();
        const monthIndex = date.getUTCMonth();
        return `${months[monthIndex]} ${day < 10 ? "0" : ""}${day} (${date.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase()})`;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.schedule_matchbox {
    position: relative;
    display: flex;
    flex-direction: row;
    background: linear-gradient(0deg, $open-dark, $open-dark), linear-gradient(0deg, #383838, #383838);
    border: 1px solid rgba(56, 56, 56, 1);
    height: 153px;
    width: 100%;
    z-index: 2;

    &__staff {
        &_assignment {
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 40px;
            background-color: $open-red;
            background-image: url("../../img/site/open/gear.svg");
            background-size: 20px;
            background-position: center;
            background-repeat: no-repeat;
            color: black;
            position: absolute;
            left: -10px;
            top: 0;
            bottom: 0;
            margin: auto;
            padding: 5px;
            z-index: 1;

            &:hover, &--active {
                left: -40px;
            }
        }

        &_box {
            height: fit-content;
            width: fit-content;
            position: absolute;
            left: -240px;
            top: 0;
            bottom: 0;
            margin: auto;
            padding: 10px 6px;
            background-color: $open-red;
            color: black;
            position: absolute;
            font-size: $font-sm;
            font-weight: bold;
            display: flex;
            flex-direction: column;
            gap: 5px;

            &__section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;

                &__content {
                    width: 100px;
                    font-size: $font-sm;
                    font-weight: bold;
                    padding: 0 2px;
                    border: 2px solid $open-dark;
                    background-color: $open-red;

                    &:focus-visible {
                        outline: none;
                    }

                    & option {
                        font-size: $font-xsm;
                        font-family: $font-univers;
                        font-weight: bold;
                        padding: 0 2px;
                        background-color: $open-red;

                        &:disabled {
                            color: $open-dark;
                        }
                    }
                }
            }

            &__triangle {
                position: absolute;
                top: 0;
                bottom: 0;
                margin: auto;
                transform: rotate(-90deg);
                color: #EF3255;
                right: -10px;
            }
        }
    }

    &__potential {
        position: absolute;
        top: 0;
        width: 100%;
        background-color: $open-red;
        font-weight: bold;
        color: $open-dark;
        text-align: center;
    }

    &_date {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 30px;
        justify-content: center;
        align-items: center;
        white-space: nowrap;
        z-index: 2;
        background-color: $open-dark;

        &__ID {
            font-size: 18px;
            font-weight: 600;
            color: $open-red;
        }

        &__month {
            font-size: 21px;
            font-weight: 700;
            font-stretch: condensed;
            color: rgba(235, 235, 235, 1);
        }
    }

    &_teams {
        display: flex;
        justify-content: center;
        width: 100%;
        color: $open-dark;
        background-color: #FAFAFA;

        &__side {
            flex: 1;
        }
        
        &__vs {
            display: grid;
            width: 52px;
            height: 100%;
            justify-content: center;
            align-items: center;
            
            font-size: 30px;
            font-weight: 700;
            font-stretch: condensed;
            line-height: 36px;
            letter-spacing: 0em;
            text-align: center;
            
            color: white;
            background-color: $open-red;
        }

    }

    &_links {
        display: flex;
        flex-wrap: wrap;

        padding: 15px;
        border-left: 1px solid $open-red;
        justify-content: center;
        align-items: flex-start;

        gap: 15px;
        max-width: 125px;

        &__placeholder {
            width: 27px;
        }

        &__staff {
            color: white;
            background-color: $open-red;
            font-weight: bold;
            font-stretch: condensed;
            padding: 0 10px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
    }
}
</style>