<template>
    <div class="referee">
        <div class="referee__container">
            <OpenTitle>
                {{ $t('open.referee.title') }}
            </OpenTitle>
            <!-- Matchup list -->
            <div class="referee__matchups">
                <NuxtLink 
                    v-for="matchup in matchupList"
                    :key="matchup.ID"
                    class="referee__matchups__matchup"
                    :to="`/referee/${matchup.ID}`"
                >
                    <div class="referee__matchups__matchup_name">
                        ({{ matchup.ID }}) {{ matchup.teams?.map(team => team.name).join(" vs ") ?? (matchup.team1 || matchup.team2) ? `${matchup.team1?.name || "TBD"} vs ${matchup.team2?.name || "TBD"}` : "TBD" }}
                    </div>
                    <div class="referee__matchups__matchup_date">
                        {{ formatDate(matchup.date) }} {{ formatTime(matchup.date) }}
                    </div>
                </NuxtLink>
                <ContentButton
                    v-if="moreMatchups"
                    class="referee__matchups__button content_button--red content_button--red_sm"
                    @click.native="loadMore"
                >
                    {{ $t('open.referee.loadMore') }}
                </ContentButton>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenSelect from "../../../Assets/components/open/OpenSelect.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import { Matchup } from "../../../Interfaces/matchup";
import { Tournament } from "../../../Interfaces/tournament";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        OpenSelect,
        OpenTitle,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament.description},
                {name: "twitter:image", content: require("../../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Referee extends Vue {

    @openModule.State tournament!: Tournament | null;

    matchupList: Matchup[] = [];
    moreMatchups = true;

    async mounted () {
        const { data: matchupData } = await this.$axios.get<{
            success: false;
            error: string;
        } | {
            success: true;
            matchups: Matchup[];
        }>(`/api/referee/matchups/${this.tournament?.ID}`);
        if (!matchupData.success) {
            alert(matchupData.error);
            await this.$router.push("/");
            return;
        }

        this.matchupList = matchupData.matchups?.map(matchup => ({
            ...matchup,
            date: new Date(matchup.date),
        })) || [];

        if (matchupData.matchups?.length < 5)
            this.moreMatchups = false;
    }

    async loadMore () {
        const { data: matchupData } = await this.$axios.get<{
            success: false;
            error: string;
        } | {
            success: true;
            matchups: Matchup[];
        }>(`/api/referee/matchups/${this.tournament?.ID}?skip=${this.matchupList.length}`);
        if (!matchupData.success) {
            alert(matchupData.error);
            await this.$router.push("/");
            return;
        }

        if (matchupData.matchups?.length && matchupData.matchups.length < 5)
            this.moreMatchups = false;

        this.matchupList.push(...matchupData.matchups?.map(matchup => ({
            ...matchup,
            date: new Date(matchup.date),
        })) || []);
    }

    formatDate (date: Date): string {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = date.getUTCDate();
        const monthIndex = date.getUTCMonth();
        return `${months[monthIndex]} ${day < 10 ? "0" : ""}${day}`;
    }

    formatTime (date: Date): string {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    }

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.referee {
    width: 100%;

    &__container {
        width: 95vw;
        align-self: center;
        position: relative;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }

    &__matchups {
        display: flex;
        flex-direction: column;
        gap: 20px;

        &__matchup {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
            border-radius: 5px;
            background: #333333;
            cursor: pointer;

            &:hover {
                background: #444444;
                text-decoration: none;
            }

            &__name {
                font-size: $font-lg;
                font-weight: 500;
            }

            &__date {
                font-size: $font-base;
                font-weight: 300;
            }
        }

        &__button {
            max-width: 300px;
        }
    }
}

</style>