<template>
    <div class="qualifiers">
        <div class="qualifiers__sub_header">
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'mappool' }"
                @click="page = 'mappool'"
            >
                {{ $t('open.qualifiers.nav.mappool') }}
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'qualifiers' }"
                @click="page = 'qualifiers'"
            >
                {{ $t('open.qualifiers.nav.qualifiers') }}
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'scores' }"
                @click="page = 'scores'; $store.dispatch('open/setQualifierScores', tournament?.ID);"
            >
                {{ $t('open.qualifiers.nav.scores') }}
            </div>
        </div>
        <div class="qualifiers__main_content">
            <OpenTitle>
                {{ $t('open.qualifiers.nav.qualifiers') }}
                <template #buttons>
                    <div
                        v-if="page === 'mappool' && qualifiersStage?.mappool?.[0].isPublic"
                        class="qualifiers__button_group"
                    >
                        <!-- TODO: NOT MAKE THIS A STATIC LINK LOL -->
                        <a 
                            href="https://docs.google.com/spreadsheets/d/1Bl-G_jKyxxMrTtgEJ6j2uYnHtDoPz8uG_flSKWkc734/edit#gid=2089223782"
                            class="qualifiers__button"
                        >
                            <div class="qualifiers__button_text">
                                {{ $t('open.qualifiers.mappool.sheets') }}
                            </div>
                            <img 
                                class="qualifiers__button_ico" 
                                src="../../Assets/img/site/open/mappool/sheets-ico.svg"
                            >
                        </a>
                        <a 
                            v-if="page === 'mappool'"
                            :href="qualifiersStage?.mappool?.[0].mappackLink || ''"
                            class="qualifiers__button"
                        >
                            <div class="qualifiers__button_text">
                                {{ $t('open.qualifiers.mappool.mappool') }}
                            </div>
                            <img 
                                class="qualifiers__button_ico"
                                src="../../Assets/img/site/open/mappool/dl-ico.svg"
                            >
                        </a>
                    </div>
                    <div
                        v-if="page === 'scores'"
                        class="qualifiers__button_group"
                    >
                        <div class="qualifiers__header_subtext">
                            <span>{{ $t('open.qualifiers.scores.category') }}</span>
                            <span>{{ $t('open.qualifiers.scores.select') }}</span>
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
                    </div>
                    <div
                        v-if="page === 'qualifiers'"
                        class="qualifiers__button_group"
                    >
                        <ContentButton 
                            v-if="team && loggedInUser && team.manager.ID === loggedInUser.ID && !team.qualifier"
                            class="content_button--header_button"
                            :class="{ 'content_button--disabled': !team || !tournament || tournament.minTeamSize > team.members.length || tournament.maxTeamSize < team.members.length }"
                            @click.native="togglePopup()"
                        >
                            CREATE
                        </ContentButton>
                        <BaseModal
                            v-if="isOpen"
                            @click.native="togglePopup()"
                        >
                            <span>You cannot create/join a qualifier until you have {{ tournament?.minTeamSize === tournament?.maxTeamSize ? tournament?.minTeamSize : tournament?.minTeamSize + " to " + tournament?.maxTeamSize }} players!</span>
                            <span>Press anywhere to close</span>
                        </BaseModal>
                    </div>
                </template>
            </OpenTitle>
            <MappoolView 
                v-if="page === 'mappool' && qualifiersStage?.mappool?.[0].isPublic"
                :pool="qualifiersStage.mappool[0]"
            />
            <div
                v-else-if="page === 'mappool'"
                class="qualifiers__button_group"
            >
                Mappool not available yet
            </div>
            <ScoresView
                v-else-if="page === 'scores'"
                :view="scoreView"
            />
            <QualifiersView
                v-else-if="page === 'qualifiers'"
                class="qualifiers__qualifiers"
            />
        </div>
        <QualifierModal
            v-if="editQualifier && team && team.manager.ID === loggedInUser?.ID"
            @close="closeQualifierEdit"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import OpenButton from "../../Assets/components/open/OpenButton.vue";
import MappoolView from "../../Assets/components/open/MappoolView.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import QualifierModal from "../../Assets/components/open/QualifierModal.vue";
import QualifiersView from "../../Assets/components/open/QualifiersView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../Assets/components/BaseModal.vue";

import { Stage } from "../../Interfaces/stage";
import { Tournament } from "../../Interfaces/tournament";
import { Team } from "../../Interfaces/team";
import { UserInfo } from "../../Interfaces/user";

const openModule = namespace("open");

@Component({
    components: {
        OpenButton,
        MappoolView,
        ContentButton,
        ScoresView,
        OpenTitle,
        QualifierModal,
        QualifiersView,
        BaseModal,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: this.$route.path}, 
                {hid: "og:description", property: "og:description", content: this.$store.state["open"].tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state["open"].title},
                {name: "twitter:description", content: this.$store.state["open"].tournament.description},
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
    page: "mappool" | "qualifiers" | "scores" = "qualifiers";
    scoreView: "players" | "teams" = "teams";

    @State loggedInUser!: UserInfo | null;

    @openModule.State tournament!: Tournament | null;
    @openModule.State team!: Team | null;

    get qualifiersStage (): Stage | null {
        return this.tournament?.stages.find(s => s.stageType === 0) || null;
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
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &__sub_header {
        display: flex;
        justify-content: center;
        width: 100%;
        top: 0px;
        background-color: $open-red;
        color: $open-dark;

        &_item {
            position: relative;
            display: flex;
            justify-content: center;

            cursor: pointer;
            width: auto;
            text-decoration: none;
            font-weight: 700;
            padding: 5px 90px;

            &:hover, &--active {
                color: $white;
            }

            &--active::after {
                content: "";
                position: absolute;
                top: calc(50% - 4.5px/2);
                right: calc(100% - 4.5em);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $white;
            }
        }
    }

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }

    &__qualifiers {
        overflow: auto;
    }

    &__button {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        flex-direction: row-reverse;
        background-color: $open-red;
        margin: 15px 0px 15px 20px;
        min-width: 150px;
        height: 30px;
        padding: 5px;

        &:hover {
            text-decoration: none;
        }

        &_group {
            display: flex;
            flex-direction: row;
        }

        &_text {
            color: $open-dark;
            font-weight: 600;
        }

        &_ico {
            vertical-align: -10%;
        }
    }

    &__header_subtext {
        font-family: $font-swis721;
        font-weight: 400;
        font-size: $font-sm;
        text-align: right;
        margin-top: 15px;
        color: #909090;
        display: flex;
        flex-direction: column;
    }
}
</style>