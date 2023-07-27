<template>
    <div class="team_card">
        <div class="team_card__avatar" />
        <div class="team_card_details">
            <div class="team_card_details__name">
                goofy ahh lil jits
            </div>
            <div class="team_card_details_teamrank">
                <div class="team_card--title">
                    RANK
                </div>
                <div class="team_card_details_teamrank__rank">
                    1
                </div>
            </div>
            <div class="team_card_details_teambws">
                <div class="team_card--title">
                    TEAM BWS AVG
                </div>
                <div class="team_card_details_teambws__bws">
                    99
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class TeamCard extends Vue {
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.team_card {
    display: flex;
    flex-direction: row;
    height: 100%;


    &__avatar {
        width: 129px;
        height: 100%;
        background-image: url("../../img/test_avatar.png"); // Replace later
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
    }

    &_details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 15px;

        &__name {
            font-family: $font-ggsans;
            font-size: 28px;
            font-weight: 700;
            line-height: 37px;
            letter-spacing: 0em;
            text-align: left;
        }
        &_teamrank {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            
            &__rank {
                font-family: $font-swis721;
                font-size: 21px;
                font-style: italic;
                font-weight: 700;
                line-height: 25px;
                letter-spacing: 0em;
                text-align: center;
            }
        }
        &_teambws {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;

            &__bws {
                font-family: $font-swis721;
                font-size: 21px;
                font-style: italic;
                font-weight: 700;
                line-height: 25px;
                letter-spacing: 0em;
                text-align: left;
            }
        }

    }

    &--title {
        font-family: $font-ggsans;
        font-size: 12px;
        font-weight: 600;
        text-align: left;
        color: $open-red;
    }
}

</style>