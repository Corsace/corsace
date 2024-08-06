<template>
    <div class="schedule">
        <div class="schedule_main_content">
            <OpenTitle>
                {{ $t("open.schedule.title") }} - <span class="schedule_main_content__abbreviation">{{ selectedStage?.abbreviation.toUpperCase() || '' }}</span>
                <template #right>
                    <OpenFilter>
                        <template #view>
                            <div
                                :class="{ 'open_filter__selected': view === 'ALL' }"
                                @click="view = 'ALL'"
                            >
                                {{ $t("open.schedule.all") }}
                            </div>
                            <div 
                                :class="{ 'open_filter__selected': view === 'UPCOMING' }"
                                @click="view = 'UPCOMING'"
                            >
                                {{ $t("open.schedule.upcoming") }}
                            </div>
                            <div 
                                :class="{ 'open_filter__selected': view === 'ONGOING' }"
                                @click="view = 'ONGOING'"
                            >
                                {{ $t("open.schedule.ongoing") }}
                            </div>
                            <div 
                                :class="{ 'open_filter__selected': view === 'PAST' }"
                                @click="view = 'PAST'"
                            >
                                {{ $t("open.schedule.past") }}
                            </div>
                            <div class="open_filter__separator" />
                            <div
                                :style="{ fontWeight: hidePotentials ? 'bold' : 'normal' }"
                                @click="hidePotentials = !hidePotentials"
                            >
                                {{ $t("open.schedule.hidePotentials") }}
                            </div>
                            <div class="open_filter__separator" />
                            <div
                                v-if="loggedInUser"
                                :style="{ fontWeight: myMatches ? 'bold' : 'normal' }"
                                @click="myMatches = !myMatches"
                            >
                                {{ $t("open.schedule.myMatches") }}
                            </div>
                            <div
                                v-if="loggedInUser?.staff.staff"
                                :style="{ fontWeight: myStaff ? 'bold' : 'normal' }"
                                @click="myStaff = !myStaff"
                            >
                                {{ $t("open.schedule.myMatchesStaff") }}
                            </div>
                        </template>
                        <template #sort>
                            <div
                                v-for="sort in sorts"
                                :key="sort"
                                :class="{ 'open_filter__selected': currentSort === sort }"
                                @click="currentSort === sort ? (sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC') : (currentSort = sort)"
                            >
                                <div
                                    v-if="currentSort === sort"
                                    class="open_filter__arrows"
                                >
                                    <div :class="{ 'open_filter__arrows--selected': sortDir === 'ASC' }">
                                        ▲
                                    </div>
                                    <div :class="{ 'open_filter__arrows--selected': sortDir === 'DESC' }">
                                        ▼
                                    </div>
                                </div>
                                {{ $t(`open.components.filter.sorts.${sort}`) }}
                            </div>
                            <div class="open_filter__separator" />
                            <div 
                                class="schedule__matchID_filter"
                                style="cursor: default;"
                            >
                                {{ $t("open.schedule.matchID") }}
                                <div
                                    class="schedule__matchID_filter_container"
                                    style="cursor: default;"
                                >
                                    <div
                                        v-for="matchID in visibleMatchIDs"
                                        :key="matchID"
                                        class="schedule__matchID_filter__selection"
                                        :class="{ 'schedule__matchID_filter__selection--selected': selectedMatchIDs[matchID] }"
                                        @click="selectedMatchIDs[matchID] = !selectedMatchIDs[matchID]"
                                    >
                                        {{ matchID }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </OpenFilter>
                    <StageSelector
                        :not-beginning="selectedStage?.ID !== stageList[0]?.ID"
                        :not-end="selectedStage?.ID !== stageList[stageList.length - 1]?.ID"
                        @prev="index--"
                        @next="index++"
                    >
                        <template #text>
                            {{ $t("open.components.stageSelector") }}
                        </template>

                        <template #stage>
                            {{ selectedStage?.abbreviation.toUpperCase() || '' }}
                        </template>
                    </StageSelector>
                    <SearchBar
                        :placeholder="`${$t('open.teams.searchPlaceholder')}`"
                        @update:search="searchValue = $event"
                    />
                    <!-- TODO: NOT MAKE THIS A STATIC LINK LOL -->
                    <ContentButton
                        class="content_button--red"
                        :link="'https://docs.google.com/spreadsheets/d/1f2538nh9McAii15EJkHU18fi65ICQihxsmvTK-qhA0w'"
                        :img-src="require('../../Assets/img/site/open/mappool/sheets-ico.svg')"
                        external
                    >
                        {{ $t('open.qualifiers.mappool.sheets') }}
                    </ContentButton>
                </template>
            </OpenTitle>
            <div class="schedule_main_content_matches">
                <ScheduleMatchBox
                    v-for="matchup in filteredMatchups"
                    :key="matchup.ID"
                    :matchup="matchup"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";
import ScheduleMatchBox from "../../Assets/components/open/ScheduleMatchBox.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import OpenFilter from "../../Assets/components/open/OpenFilter.vue";
import SearchBar from "../../Assets/components/SearchBar.vue";

import { Tournament } from "../../Interfaces/tournament";
import { Stage, StageType } from "../../Interfaces/stage";
import { MatchupList } from "../../Interfaces/matchup";
import { UserInfo } from "../../Interfaces/user";

const openModule = namespace("open");

@Component({
    components: {
        StageSelector,
        OpenTitle,
        ScheduleMatchBox,
        ContentButton,
        OpenFilter,
        SearchBar,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament?.description || ""},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament?.description || ""},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament?.description || ""},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Schedule extends Vue {
    
    @State loggedInUser!: UserInfo | null;
    @openModule.State tournament!: Tournament | null;
    @openModule.State matchupList!: MatchupList[] | null;

    stageList: Stage[] = [];
    index = 0;
    searchValue = "";
    view: "ALL" | "UPCOMING" | "ONGOING" | "PAST" = "ALL";
    hidePotentials = false;
    myMatches = false;
    myStaff = false;
    sortDir: "ASC" | "DESC" = "ASC";
    sorts = ["DATETIME", "MATCHID", "RANK AVERAGE", "BWS AVERAGE", "RANK DIFF", "BWS DIFF"] as const;
    sortFunctions: Record<typeof this.sorts[number], (a: MatchupList, b: MatchupList) => number> = {
        DATETIME: (a, b) => a.date.getTime() - b.date.getTime(),
        MATCHID: (a, b) => a.matchID > b.matchID ? 1 : -1,
        "RANK AVERAGE": (a, b) => !a.teams || !b.teams ? 0 : a.teams.reduce((acc, team) => acc + team.rank, 0) / (a.teams.length || 1) - b.teams.reduce((acc, team) => acc + team.rank, 0) / (b.teams.length || 1),
        "BWS AVERAGE": (a, b) => !a.teams || !b.teams ? 0 : a.teams.reduce((acc, team) => acc + team.BWS, 0) / (a.teams.length || 1) - b.teams.reduce((acc, team) => acc + team.BWS, 0) / (b.teams.length || 1),
        "RANK DIFF": (a, b) => !a.teams || !b.teams ? 0 : (Math.max(...a.teams.map(team => team.rank)) - Math.min(...a.teams.map(team => team.rank))) - (Math.max(...b.teams.map(team => team.rank)) - Math.min(...b.teams.map(team => team.rank))),
        "BWS DIFF": (a, b) => !a.teams || !b.teams ? 0 : (Math.max(...a.teams.map(team => team.BWS)) - Math.min(...a.teams.map(team => team.BWS)) - (Math.max(...b.teams.map(team => team.BWS)) - Math.min(...b.teams.map(team => team.BWS)))),
    };
    currentSort: typeof this.sorts[number] = "DATETIME";
    
    get selectedStage (): Stage | null {
        return this.stageList[this.index] || null;
    }

    get filteredMatchups () {
        if (!this.matchupList) return [];
        return this.matchupList.filter(matchup => {
            if (matchup.matchID && !this.selectedMatchIDs[matchup.matchID[0]]) return false;
            if (this.myMatches && !matchup.teams?.some(team => team.members.some(player => player.ID === this.loggedInUser?.ID))) return false;
            if (this.myStaff) return false;
            if (this.hidePotentials && matchup.potential) return false;
            if (this.searchValue && !(
                matchup.matchID.toLowerCase().includes(this.searchValue.toLowerCase()) || 
                matchup.ID.toString().includes(this.searchValue) ||
                matchup.teams?.some(team => team.ID.toString().includes(this.searchValue)) ||
                matchup.teams?.some(team => team.name.toLowerCase().includes(this.searchValue.toLowerCase())) ||
                matchup.teams?.some(team => team.members.some(player => player.ID.toString().includes(this.searchValue))) ||
                matchup.teams?.some(team => team.members.some(player => player.osuID.includes(this.searchValue))) ||
                matchup.teams?.some(team => team.members.some(player => player.username.toLowerCase().includes(this.searchValue.toLowerCase())))
            ))
                return false;
            if (this.view === "ALL") return true;
            if (this.view === "UPCOMING") return matchup.date.getTime() > Date.now();
            if (this.view === "ONGOING") return matchup.date.getTime() < Date.now() && !matchup.mp;
            if (this.view === "PAST") return matchup.date.getTime() < Date.now();
            return false;
        }).sort((a, b) => this.sortFunctions[this.currentSort](a, b) * (this.sortDir === "ASC" ? 1 : -1));
    }

    visibleMatchIDs: string[] = [];
    selectedMatchIDs: Record<string, boolean> = {};

    @Watch("selectedStage")
    async stageMatchups () {
        if (!this.selectedStage) {
            this.$store.commit("open/setMatchups", []);
            return;
        }
        
        const ID = this.selectedStage.ID;
        this.$store.commit("open/setMatchups", []);

        await this.pause(500);
        if (ID !== this.selectedStage.ID) return;

        await this.$store.dispatch("open/setMatchups", this.selectedStage?.ID);
        const matchupIDSet = new Set<string>();
        for (const matchup of this.matchupList ?? []) {
            if (matchup.matchID)
                matchupIDSet.add(matchup.matchID[0]);
        }
        this.visibleMatchIDs = Array.from(matchupIDSet).sort();
        this.selectedMatchIDs = this.visibleMatchIDs.reduce((acc, id) => ({ ...acc, [id]: true }), {});
    }

    async pause (ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    mounted () {
        this.stageList = this.tournament?.stages.filter(stage => stage.stageType !== StageType.Qualifiers) ?? [];
        this.index = this.stageList.findIndex(stage => stage.timespan.end.getTime() > Date.now());
        if (this.index === -1)
            this.index = this.stageList.length - 1;
    }
}

</script>

<style lang="scss">
@import '@s-sass/_variables';

.schedule {

    &_main_content {
        display: flex;
        align-self: center;
        justify-content: center;
        flex-direction: column;
        width: 75vw;
        position: relative;
        padding: 35px;

        &__abbreviation {
            color: $open-red;
        }

        @media screen and (max-width: $breakpoint-xl) {
            width: 100vw;
        }

        &_matches{
            display: flex;
            flex-direction: column;
            margin-top: 20px;
            gap: 20px;
        }
    }

    &__matchID_filter {
        display: flex;
        flex-direction: column;
        gap: inherit;
        width: 100%;
        align-items: flex-end;

        &_container {
            cursor: default;
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
        }

        &__selection {
            aspect-ratio: 1/1;
            height: fit-content;
            padding: 3px;
            border: 1px solid $open-dark;
            border-radius: 2px;
            font-size: $font-xsm;

            &--selected {
                background-color: $open-dark;
                color: $open-red;
            }
        }
    }
}
</style>