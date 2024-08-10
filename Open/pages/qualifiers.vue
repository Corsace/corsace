<template>
    <div class="qualifiers">
        <SubHeader
            :selections="[
                { text: $t('open.qualifiers.nav.mappool'), value: 'mappool' },
                { text: $t('open.qualifiers.nav.qualifiers'), value: 'qualifiers' },
                { text: $t('open.qualifiers.nav.scores'), value: 'scores' },
            ]"
            :current-page="page"
            @update:page="pageHandler"
        />
        <div class="qualifiers__main_content">
            <OpenTitle>
                {{ $t('open.qualifiers.nav.qualifiers') }}
                <template 
                    v-if="page === 'mappool' && mappools?.[0].isPublic"
                    #right
                >
                    <Clock />
                    <ContentButton
                        class="content_button--red"
                        :link="'https://docs.google.com/spreadsheets/d/1f2538nh9McAii15EJkHU18fi65ICQihxsmvTK-qhA0w'"
                        :img-src="require('../../Assets/img/site/open/mappool/sheets-ico.svg')"
                        external
                    >
                        {{ $t('open.qualifiers.mappool.sheets') }}
                    </ContentButton>
                    <ContentButton
                        class="content_button--red"
                        :link="mappools?.[0].mappackLink || ''"
                        :img-src="require('../../Assets/img/site/open/mappool/dl-ico.svg')"
                        external
                    >
                        {{ $t('open.qualifiers.mappool.mappool') }}
                    </ContentButton>
                </template>
                <template
                    v-else-if="page === 'scores'"
                    #right
                >
                    <Clock />
                    <div class="qualifiers__header_subtext">
                        {{ $t('open.qualifiers.scores.categorySelect') }}
                    </div>
                    <ContentButton 
                        class="content_button--header_button"
                        :class="{
                            'content_button--red': scoreView === 'players',
                            'content_button--red_outline': scoreView !== 'players',
                        }"
                        @click.native="scoreView = 'players'"
                    >
                        {{ $t('open.qualifiers.scores.players') }}
                    </ContentButton>
                    <ContentButton 
                        class="content_button--header_button"
                        :class="{
                            'content_button--red': scoreView === 'teams',
                            'content_button--red_outline': scoreView !== 'teams',
                        }"
                        @click.native="scoreView = 'teams'"
                    >
                        {{ $t('open.qualifiers.scores.teams') }}
                    </ContentButton>
                    <ContentButton
                        class="content_button--red content_button--font_sm"
                        @click.native="placementLock = !placementLock"
                    >
                        {{ placementLock ? $t('open.qualifiers.scores.lockedPlacement') : $t('open.qualifiers.scores.unlockedPlacement') }}
                    </ContentButton>
                </template>
                <template 
                    v-else-if="page === 'qualifiers'"
                    #right
                >
                    <Clock />
                    <BaseModal
                        v-if="isOpen"
                        @click.native="togglePopup()"
                    >
                        <span> {{ $t('open.qualifiers.error.message', { numPlayers: tournament?.minTeamSize === tournament?.maxTeamSize ? tournament?.minTeamSize : tournament?.minTeamSize + " to " + tournament?.maxTeamSize }) }}</span>
                        <span> {{ $t('open.qualifiers.error.pressToClose') }}</span>
                    </BaseModal>
                </template>
            </OpenTitle>
            <MappoolView 
                v-if="page === 'mappool' && mappools?.[0].isPublic"
                :pool="mappools[0]"
            />
            <div v-else-if="page === 'mappool'">
                {{ $t("open.qualifiers.mappool.notAvailable") }}
            </div>
            <ScoresView
                v-else-if="page === 'scores' && mappools?.[0].isPublic"
                tiers
                :view="scoreView"
                :placement-lock="placementLock"
                :pool="mappools[0]"
            />
            <QualifiersView
                v-else-if="page === 'qualifiers'"
                class="qualifiers__qualifiers"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import Clock from "../../Assets/components/open/Clock.vue";
import MappoolView from "../../Assets/components/open/MappoolView.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import QualifiersView from "../../Assets/components/open/QualifiersView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../Assets/components/BaseModal.vue";
import SubHeader from "../../Assets/components/open/SubHeader.vue";

import { Stage, StageType } from "../../Interfaces/stage";
import { Tournament } from "../../Interfaces/tournament";
import { UserInfo } from "../../Interfaces/user";
import { Mappool } from "../../Interfaces/mappool";

const openModule = namespace("open");

@Component({
    components: {
        Clock,
        MappoolView,
        ContentButton,
        ScoresView,
        OpenTitle,
        QualifiersView,
        BaseModal,
        SubHeader,
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
export default class Qualifiers extends Vue {
    isOpen = false;
    calledScores = false;
    calledMappool = false;
    page: "mappool" | "qualifiers" | "scores" = "qualifiers";
    scoreView: "players" | "teams" = "teams";
    placementLock = false;

    @State loggedInUser!: UserInfo | null;

    @openModule.State tournament!: Tournament | null;
    @openModule.State mappools!: Mappool[] | null;

    get qualifiersStage (): Stage | null {
        return this.tournament?.stages.find(s => s.stageType === StageType.Qualifiers) ?? null;
    }

    async pageHandler (page: "mappool" | "qualifiers" | "scores") {
        if (page === "mappool")
            await this.getMappool();
        else if (page === "scores")
            await this.getScores();
        else
            this.page = page;
    }

    async getMappool () {
        this.page = "mappool";
        if (!this.calledMappool) {
            await this.$store.dispatch("open/setMappools", this.qualifiersStage?.ID);
            this.calledMappool = true;
        }
    }

    async getScores () {
        this.page = "scores";
        if (!this.calledScores) {
            if (!this.calledMappool) {
                await this.$store.dispatch("open/setMappools", this.qualifiersStage?.ID);
                this.calledMappool = true;
            }
            await this.$store.dispatch("open/setScores", this.qualifiersStage?.ID);
            this.calledScores = true;
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers {

    &__main_content {
        align-self: center;
        position: relative;
        width: 75vw;
        padding: 35px;
    }

    &__header_subtext {
        font-weight: bold;
        font-stretch: condensed;
        font-size: $font-sm;
        text-align: right;
        color: #909090;
        width: min-content;
    }
}
</style>