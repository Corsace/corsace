<template>
    <div class="info">
        <SubHeader
            :selections="[
                { text: $t('open.info.title'), value: 'info' },
                { text: $t('open.info.condensed'), value: 'condensed' },
            ]"
            :current-page="page"
            @update:page="page = $event"
        />
        <div class="info_wrapper">
            <OpenTitle v-if="page === 'condensed'">
                {{ $t('open.info.title') }}
            </OpenTitle>
            <div
                v-if="tournament && page === 'info'"
                class="info_main info_section"
            >
                <div class="info_desc__text">
                    {{ tournament.description }}
                </div>
                <!--                <div class="info_desc__buttons">-->
                <!--                    <ContentButton -->
                <!--                        class="content_button&#45;&#45;red info_desc_button content_button&#45;&#45;margin"-->
                <!--                        link="https://paypal.me/corsaceofficial"-->
                <!--                        external-->
                <!--                    >-->
                <!--                        {{ $t('open.info.donateToCorsace') }}-->
                <!--                    </ContentButton>-->
                <!--                    <ContentButton -->
                <!--                        class="content_button&#45;&#45;red info_desc_button content_button&#45;&#45;margin"-->
                <!--                        link="http://momokai.com/corsace"-->
                <!--                        external-->
                <!--                    >-->
                <!--                        {{ $t('open.info.supportViaSponsorship') }}-->
                <!--                    </ContentButton>-->
                <!--                </div>-->
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.generalInfo') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul 
                        class="info_desc__list"
                        v-html="$t('open.info.generalInfoText')"
                    />
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.prizes') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul
                        class="info_desc__list"
                        v-html="$t('open.info.prizesText')"
                    />
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.qualifiersProcedures') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul
                        class="info_desc__list"
                        v-html="$t('open.info.qualifiersProceduresText')"
                    />
                    <h2>{{ $t('open.info.seeding') }}</h2>
                    <ul
                        class="info_desc__list"
                        v-html="$t('open.info.seedingText')"
                    />
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.tournamentStructure') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <span v-html="$t('open.info.tournamentStructureText.initialText')" />
                    <h2>{{ $t('open.info.tournamentStructureText.sw1Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.sw1')"
                        />
                        <img
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--small"
                            src="../../Assets/img/site/open/info/w1.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.sw2Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.sw2')"
                        />
                        <img 
                            class="info_desc__list_wrapper__image"
                            src="../../Assets/img/site/open/info/w2.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.sw3Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.sw3')"
                        />
                        <img 
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w3.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.sw4Header') }}</h2>
                    <div class="info_desc__list_wrapper">     
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.sw4')"
                        />
                        <img 
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w4.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.sw5Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.sw5')"
                        />
                        <img
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w4.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.ko1Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.ko1')"
                        />
                        <img
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w4.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.ko2Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.ko2')"
                        />
                        <img
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w4.png"
                        >
                    </div><hr class="line--red line--bottom-space">
                    <h2>{{ $t('open.info.tournamentStructureText.ko3Header') }}</h2>
                    <div class="info_desc__list_wrapper">
                        <ul
                            class="info_desc__list"
                            v-html="$t('open.info.tournamentStructureText.ko3')"
                        />
                        <img
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w4.png"
                        >
                    </div>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.matchProcedures') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul
                        class="info_desc__list"
                        v-html="$t('open.info.matchProceduresText')"
                    />
                    <h2>{{ $t('open.info.freemodRules') }}</h2>
                    <ul
                        class="info_desc__list"
                        v-html="$t('open.info.freemodRulesText')"
                    />
                    <h2>{{ $t('open.info.disconnections') }}</h2>
                    <ul
                        class="info_desc__list"
                        v-html="$t('open.info.disconnectionsText')"
                    />
                    <ContentButton 
                        class="content_button--red info_report_button content_button--margin"
                        link="https://pif.ephemeral.ink/tournament-reports"
                        external
                    >
                        {{ $t('open.info.reportTournament') }}
                    </ContentButton>
                    <p><em>*{{ $t('open.info.subjectToChange') }}</em></p>
                </div>
            </div>
            <div 
                v-else-if="tournament && page === 'condensed'"
                class="info_main"
            >
                <div class="info_desc">
                    <div>
                        <img src="../../Assets/img/site/open/banner.png">
                    </div>
                    <hr class="line--gray line--no-fill">
                    <div class="info_desc__text">
                        {{ tournament.description }}
                    </div>
                    <hr class="line--gray line--no-fill">
                    <ContentButton 
                        class="content_button--red info_report_button content_button--margin"
                        link="https://pif.ephemeral.ink/tournament-reports"
                        external
                    >
                        {{ $t('open.info.reportTournament') }}
                    </ContentButton>
                    <div class="info_match">
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.matchSize') }}
                            </template>
                            {{ tournament.matchupSize }}v{{ tournament.matchupSize }}
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.minPlayers') }}
                            </template>
                            {{ tournament.minTeamSize }}
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.maxPlayers') }}
                            </template>
                            {{ tournament.maxTeamSize }}
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.pickTimer') }}
                            </template>
                            {{ tournament.mapTimer || 90 }} s
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.readyTimer') }}
                            </template>
                            {{ tournament.readyTimer || 90 }} s
                        </MatchBox>
                    </div>
                </div>
                <div 
                    class="info_stages"
                >
                    <div class="info_stage_selector">
                        <ContentButton 
                            v-for="stage in stageList"
                            :key="stage.ID"
                            :class="{ 'content_button--active': selectedStage === stage.ID }"
                            @click.native="selectedStage = stage.ID"
                        >
                            {{ $t(`open.stages.${stage.name.toLowerCase()}`) }}
                        </ContentButton>
                    </div>
                    <div
                        v-if="stage"
                        class="info_stage_panel"
                    >
                        <div class="info_stage_title">
                            {{ $t(`open.stages.${stage.name.toLowerCase()}`) }} 
                            <span class="info_stage_title--red">{{ $t(`open.stages.abbreviations.${stage.abbreviation.toLowerCase()}`) }}</span> 
                            <div class="info_stage_title__status">
                                <MatchStatus 
                                    class="status"
                                    :class="{ 'status--not_started': stageStatus === 'notStarted', 'status--ongoing': stageStatus === 'ongoing', 'status--completed': stageStatus === 'complete' }"
                                >
                                    {{ $t(`open.info.status.${stageStatus}`) }}
                                </MatchStatus>
                            </div>
                            <hr class="line--gray line--bottom-space-default">
                        </div>
                        <div class="info_stage_data">
                            <div class="info_stage_data__content">
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.order') }}
                                    </template>
                                    <template #value>
                                        {{ stage.order }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.scoringMethod') }}
                                    </template>
                                    <template #value>
                                        {{ scoringMethod }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.type') }}
                                    </template>
                                    <template #value>
                                        {{ stageType }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.initialSize') }}
                                    </template>
                                    <template #value>
                                        {{ stage.initialSize }}
                                    </template>
                                </InfoData>
                            </div>
                            <div class="line--vertical_gray" />
                            <div class="info_stage_data__content">
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.startDate') }}
                                    </template>
                                    <template #value>
                                        {{ stage.timespan.start.toUTCString() }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.endDate') }}
                                    </template>
                                    <template #value>
                                        {{ stage.timespan.end.toUTCString() }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.rounds') }}
                                    </template>
                                    <template #value>
                                        {{ stage.rounds.length ? `${stage.rounds.length} rounds` : "N/A" }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.finalSize') }}
                                    </template>
                                    <template #value>
                                        {{ stage.finalSize }}
                                    </template>
                                </InfoData>
                            </div>
                        </div>
                    </div>
                    <div class="info_stage_panel">
                        <div class="info_stage_title">
                            {{ $t("open.info.headings.mappools") }}
                        </div>
                        <hr class="line--gray line--bottom-space-default">
                        <div class="info_stage_data--bottom_padding">
                            <div class="info_stage_data__content">
                                <div class="info_stage_data_mappools_selector">
                                    <ContentButton 
                                        v-for="mappool in stageMappoolsList"
                                        :key="mappool.ID"
                                        class="content_button--bottom_margin"
                                        :class="{ 'content_button--active': selectedMappool === mappool.ID }"
                                        @click.native="selectedMappool = mappool.ID"
                                    >
                                        {{ $t(`open.stages.${mappool.name.toLowerCase()}`) }}
                                    </ContentButton>
                                </div>
                            </div>
                            <div class="line--vertical_gray" />
                            <div 
                                v-if="mappool"
                                class="info_stage_data__mappool_data"
                            >
                                <div class="info_stage_data_text">
                                    <div class="info_stage_data_text__title">
                                        {{ $t(`open.stages.${mappool.name.toLowerCase()}`) }}
                                    </div>
                                    <div>
                                        <ul>
                                            <li
                                                v-for="slot in mappool.slots"
                                                :key="slot.ID"
                                            >
                                                {{ slot.name }} ({{ slot.acronym }}): {{ slot.maps.length }} maps
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="info_stage_data_button_group">
                                    <ContentButton
                                        :class="{ 
                                            'content_button--red': mappool.isPublic,
                                            'content_button--disabled': !mappool.isPublic,
                                        }"
                                        :link="`/mappool`"
                                        external
                                    >
                                        {{ mappool.isPublic ? $t('open.info.mappools.info') : $t('open.info.mappools.notAvailable') }}
                                    </ContentButton>
                                    <ContentButton
                                        :class="{ 
                                            'content_button--red': mappool.isPublic,
                                            'content_button--disabled': !mappool.isPublic,
                                        }"
                                        :link="mappool.isPublic ? mappool.mappackLink || '' : ''"
                                        external
                                    >
                                        {{ mappool.isPublic ? $t('open.info.mappools.mappackDownload') : $t('open.info.mappools.mappacknotAvailable') }}
                                    </ContentButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div 
                v-else
                class="info_main"
            >
                <div class="info_desc">
                    <div class="info_desc__text">
                        {{ $t('open.info.error') }}
                    </div>
                </div>
                <div class="info_stages">
                    <div class="info_stage_selector" />
                    <div class="info_stage_panel" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { Tournament } from "../../Interfaces/tournament";
import { ScoringMethod, Stage, StageType } from "../../Interfaces/stage";
import { Mappool } from "../../Interfaces/mappool";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import MatchBox from "../../Assets/components/open/InfoMatchBox.vue";
import InfoData from "../../Assets/components/open/InfoData.vue";
import MatchStatus from "../../Assets/components/open/MatchStatus.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import SubHeader from "../../Assets/components/open/SubHeader.vue";

const openModule = namespace("open");

enum StageStatus {
    NOT_STARTED = "notStarted",
    ONGOING = "ongoing",
    COMPLETED = "complete",
}

@Component({
    components: {
        ContentButton,
        MatchBox,
        InfoData,
        MatchStatus,
        OpenTitle,
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
export default class Info extends Vue {

    @openModule.State tournament!: Tournament | null;

    selectedStage = 0;
    selectedMappool = 0;
    page: "info" | "condensed" = "info";

    get stageList (): {
        ID: number; 
        name: string; 
        order: number;
    }[] {
        const stages = this.tournament?.stages.map<{
            ID: number; 
            name: string; 
            order: number;
        }>(s => {
            return {
                ID: s.ID,
                name: s.name,
                order: s.order,
            };
        }) ?? [];

        return stages;
    }

    @Watch("stageList", { immediate: true })
    onstageListChanged (list: {ID: number; name: string}[]) {
        if (list.length > 0)
            this.selectedStage = list[0]?.ID || 0;
    }

    get stage (): Stage | null {
        return this.tournament?.stages.find(s => s.ID === this.selectedStage) ?? null;
    }

    get stageType () {
        if (this.stage)
            return StageType[this.stage.stageType];
        return "";
    }

    get scoringMethod () {
        if (this.stage)
            return ScoringMethod[this.stage.scoringMethod];
        return "";
    }

    @Watch("stage", { immediate: true })
    onStageChanged (stage: Stage | null) {
        if (stage)
            this.selectedMappool = stage.mappool[0]?.ID || 0;
    }

    get stageStatus (): StageStatus {
        if (!this.stage)
            return StageStatus.NOT_STARTED;

        if (this.stage.timespan.start.getTime() > Date.now())
            return StageStatus.NOT_STARTED;

        if (this.stage.timespan.end.getTime() < Date.now())
            return StageStatus.COMPLETED;

        return StageStatus.ONGOING;
    }

    get stageMappools (): Mappool[] {
        return this.stage?.mappool ?? [];
    }

    get stageMappoolsList (): {ID: number; name: string}[] {
        return this.stageMappools.map(m => {
            return {
                ID: m.ID,
                name: m.name,
            };
        });
    }

    get mappool (): Mappool | null {
        return this.stageMappools.find(m => m.ID === this.selectedMappool) ?? null;
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.info {
    width: 100%;

    &_wrapper {
        width: 75vw;
        align-self: center;
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    &_main {
        display: flex;
        flex-direction: row;
        align-items: stretch;
    }

    &_section {
        border: 1px solid #000;
        background: linear-gradient(180deg, #1B1B1B 0%, #333 100%);
        box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
        padding: 40px;
        flex-direction: column;

        &_header {
            width: 100%;
            margin: 20px 0;
        }
    }

    /* left panel */
    &_desc {
        display: flex;
        flex-direction: column;
        width: 30%;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
        margin: 15px 20px 0 0;
        padding: 40px 35px;

        & img {
            width: 100%;
            object-fit: cover;
            overflow: hidden;
        }

        &_button {
            flex: 1;
        }

        &__images {
            display: flex;
            justify-content: space-between;

            & img {
                height: 500px;
            }
        }

        &__text {
            text-align: center;
            line-height: $font-xxl;

            &--noAlign {
                text-align: left;
            }
        }

        &__buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }

        &__list {
            display: flex;
            flex-direction: column;
            margin: 0;

            & li strong {
                color: $open-red;
                font-weight: 600;
            }

            & li red {
                color: $open-red;
                font-weight: 800;
                font-style: italic;
            }

            &_wrapper {
                display: flex;
                flex-direction: row;
                width: 100%;
                justify-content: space-between;
                overflow: hidden;
                align-items: center;
                margin-bottom: 1em;

                &__image {
                    max-height: 300px;
                    object-fit: contain;
                    overflow: hidden;

                    &--small {
                        max-height: 200px;
                    }

                    &--medium {
                        max-height: 300px;
                    }

                    &--large {
                        max-height: 400px;
                    }

                }

                &--align-left {
                    justify-content: flex-start;
                }

                &--center {
                    align-items: center;
                    justify-content: flex-end;
                }
            }
        }
    }

    &_match {
        margin-top: -10px;
    }
        
    /*right panel */
    &_stages {
        display: flex;
        flex-direction: column;
        width: 70%;   
    }         

    &_stage_selector {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 10px;
    }

    &_stage_panel {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            padding: 15px;
        
        &--grow {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            padding: 15px;
        }
    }

     &_stage_title {
        position: relative;
        font-family: $font-zurich;
        font-size: $font-xxxl;

        &__status {
            position: absolute;
            top: 10px;
            right: 0;
        }

        &--red {
            color: $open-red;
            display: inline;
        }
    }

    &_stage_panel:last-child {
        margin-top: 30px;
    }

    &_stage_data {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        height: 100%;

        &--bottom_padding {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            height: 100%;
            padding-bottom: 20px;
        }

        &__mappool_data {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex-grow: 1;
            padding-left: 20px;
            padding-right: 0;
        }

        &__content {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            padding-right: 20px;
        }

        &__content:last-child {
            padding-left: 20px;
            padding-right: 0;
        }

        &_text {
            padding: 20px 50px 20px 50px;
            display: flex;
            flex-direction: column;
            font-size: $font-lg;

            &__title {
                font-weight: 800;
                color: #EBEBEB;
            }

            & ul {
                margin-left: 35px;
                list-style-type: none;
                font-weight: 600;
            }

            & ul li {
                position: relative;
            }

            & ul li::before {
                content: "";
                position: absolute;
                top: 50%;
                left: -25px;
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }
        &_mappools_selector {
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
        }

        &_button_group {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin: 0 0 0 -15px;        
        }
    }
}
</style>
