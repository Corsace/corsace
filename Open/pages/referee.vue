<template>
    <div class="referee">
        <div class="referee__container">
            <OpenTitle>
                {{ $t('open.referee.title') }}
            </OpenTitle>
            <!-- Matchup Selected -->
            <div 
                v-if="matchup"
                class="referee__matchup"
            >
                <div class="referee__matchup__header">
                    <div class="referee__matchup__header__title">
                        ({{ matchup.ID }}) {{ `${matchup.team1?.name || "TBD"} vs ${matchup.team2?.name || "TBD"}` }}
                    </div>
                    <div class="referee__matchup__header__date">
                        {{ formatDate(matchup.date) }} {{ formatTime(matchup.date) }}
                    </div>
                    <ContentButton
                        v-if="!matchup.mp"
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        @click.native="createLobby"
                    >
                        {{ $t('open.referee.createLobby') }}
                    </ContentButton>
                </div>
                <div class="referee__matchup__content">
                    <div class="referee__matchup__content__team">
                        <div class="referee__matchup__content__team__name">
                            {{ matchup.team1?.name || "TBD" }}
                        </div>
                        <div class="referee__matchup__content__team__avatar">
                            <img 
                                :src="matchup.team1?.avatarURL || require('../../Assets/img/site/open/team/default.png')"
                                alt="Team Avatar"
                            >
                        </div>
                    </div>
                    <div class="referee__matchup__content__team">
                        <div class="referee__matchup__content__team__name">
                            {{ matchup.team2?.name || "TBD" }}
                        </div>
                        <div class="referee__matchup__content__team__avatar">
                            <img 
                                :src="matchup.team2?.avatarURL || require('../../Assets/img/site/open/team/default.png')"
                                alt="Team Avatar"
                            >
                        </div>
                    </div>
                </div>
                <div class="referee__matchup__footer">
                    <ContentButton
                        class="referee__matchup__footer__button content_button--red content_button--red_sm"
                        @click.native="back"
                    >
                        {{ $t('open.referee.back') }}
                    </ContentButton>
                </div>
            </div>
            <!-- Matchup list -->
            <div 
                v-else-if="matchupList"
                class="referee__matchups"
            >
                <div 
                    v-for="matchup in matchupList"
                    :key="matchup.ID"
                    class="referee__matchups__matchup"
                    @click="selectMatchup(matchup.ID)"
                >
                    <div class="referee__matchups__matchup_name">
                        ({{ matchup.ID }}) {{ matchup.teams?.map(team => team.name).join(" vs ") || "TBD" }}
                    </div>
                    <div class="referee__matchups__matchup_date">
                        {{ formatDate(matchup.date) }} {{ formatTime(matchup.date) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import { Tournament } from "../../Interfaces/tournament";

const openModule = namespace("open");

@Component({
    components: {
        OpenTitle,
        ContentButton,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
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
export default class Referee extends Vue {
    @openModule.State tournament!: Tournament | null;

    async mounted () {
        //
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

    &__matchup {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;

        &__header {
            display: flex;
            flex-direction: column;
            gap: 5px;

            &__title {
                font-size: $font-lg;
                font-weight: 500;
            }

            &__date {
                font-size: $font-base;
                font-weight: 300;
            }
        }

        &__content {
            display: flex;
            flex-direction: row;
            gap: 20px;
            margin-top: 20px;

            &__team {
                display: flex;
                flex-direction: column;
                gap: 5px;

                &__name {
                    font-size: $font-lg;
                    font-weight: 500;
                }

                &__avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 5px;
                    overflow: hidden;

                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                }
            }
        }

        &__footer {
            display: flex;
            flex-direction: row;
            gap: 20px;
            margin-top: 20px;

            &__button {
                width: 100%;
            }
        }
    }

    &__matchups {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 20px;

        &__matchup {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
            border-radius: 5px;
            background: #333333;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background: #444444;
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
    }
}

</style>