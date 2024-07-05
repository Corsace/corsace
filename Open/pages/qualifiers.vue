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
                    <OpenTitleButton
                        :link="'https://docs.google.com/spreadsheets/d/1NvbsvI3aa-UHdenu22zDCyoto6lqM8rPri_XZ8fCMds/edit?usp=sharing'"
                        :img-src="require('../../Assets/img/site/open/mappool/sheets-ico.svg')"
                    >
                        {{ $t('open.qualifiers.mappool.sheets') }}
                    </OpenTitleButton>
                    <OpenTitleButton
                        :link="mappools?.[0].mappackLink || ''"
                        :img-src="require('../../Assets/img/site/open/mappool/dl-ico.svg')"
                    >
                        {{ $t('open.qualifiers.mappool.mappool') }}
                    </OpenTitleButton>
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
                </template>
                <template 
                    v-else-if="page === 'qualifiers'"
                    #right
                >
                    <Clock />
                    <ContentButton 
                        v-if="team && loggedInUser && team.captain.ID === loggedInUser.ID && !team.qualifier"
                        class="content_button--header_button"
                        :class="{ 'content_button--disabled': !team || !tournament || tournament.minTeamSize > team.members.length || tournament.maxTeamSize < team.members.length }"
                        @click.native="togglePopup()"
                    >
                        {{ $t('open.qualifiers.create') }}
                    </ContentButton>
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
                :pool="mappools[0]"
            />
            <QualifiersView
                v-else-if="page === 'qualifiers'"
                class="qualifiers__qualifiers"
            />
        </div>
        <QualifierModal
            v-if="editQualifier && team && team.captain.ID === loggedInUser?.ID"
            @close="closeQualifierEdit"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import Clock from "../../Assets/components/open/Clock.vue";
import MappoolView from "../../Assets/components/open/MappoolView.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import QualifierModal from "../../Assets/components/open/QualifierModal.vue";
import QualifiersView from "../../Assets/components/open/QualifiersView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../Assets/components/BaseModal.vue";
import SubHeader from "../../Assets/components/open/SubHeader.vue";
import OpenTitleButton from "../../Assets/components/open/OpenTitleButton.vue";

import { Stage, StageType } from "../../Interfaces/stage";
import { Tournament } from "../../Interfaces/tournament";
import { Team } from "../../Interfaces/team";
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
        QualifierModal,
        QualifiersView,
        BaseModal,
        SubHeader,
        OpenTitleButton,
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
    editQualifier = false;
    calledScores = false;
    calledMappool = false;
    page: "mappool" | "qualifiers" | "scores" = "qualifiers";
    scoreView: "players" | "teams" = "teams";

    @State loggedInUser!: UserInfo | null;

    @openModule.State tournament!: Tournament | null;
    @openModule.State team!: Team | null;
    @openModule.State mappools!: Mappool[] | null;

    get qualifiersStage (): Stage | null {
        return this.tournament?.stages.find(s => s.stageType === StageType.Qualifiers) ?? null;
    }

    togglePopup () {
        if (!this.team || !this.tournament || this.tournament.minTeamSize > this.team.members.length || this.tournament.maxTeamSize < this.team.members.length) {
            this.isOpen = !this.isOpen;
            return;
        }
        this.editQualifier = true;
    }

    async closeQualifierEdit (get: boolean) {
        this.editQualifier = false;
        if (get)
            await this.$store.dispatch("open/setQualifierList", this.tournament?.ID);
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
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &__main_content {
        align-self: center;
        position: relative;
        width: 75vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }

    &__qualifiers {
        overflow: auto;
    }

    &__header_subtext {
        font-family: $font-swis721;
        font-weight: 400;
        font-size: $font-sm;
        text-align: right;
        color: #909090;
        width: min-content;
    }
}
</style>