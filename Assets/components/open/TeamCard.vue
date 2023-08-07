<template>
    <div class="team_card">
        <div
            class="team_card__avatar" 
            :style="{ 'backgroundImage': `url(${avatarSync || require('../../../Assets/img/site/open/team/default.png')})` }" 
        /> 
        <!-- Replace with avatarSync above -->
        <div class="team_card_details">
            <div class="team_card_details__name">
                <slot name="name" />
            </div>
            <div class="team_card_details_teamrank">
                <div class="team_card--title">
                    RANK
                </div>
                <div class="team_card_details_teamrank__rank">
                    <slot name="rank" />
                </div>
            </div>
            <div class="team_card_details_teambws">
                <div class="team_card--title">
                    TEAM BWS AVG
                </div>
                <div class="team_card_details_teambws__bws">
                    <slot name="bws" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync} from "vue-property-decorator";

@Component
export default class TeamCard extends Vue {
    @PropSync("avatar", { type: String, default: require("../../img/site/open/team/default.png") }) avatarSync!: string;
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.team_card {
    display: flex;
    flex-direction: row;
    height: 100%;
    white-space: nowrap;

    &__avatar {
        width: 129px;
        height: 100%;
        overflow: hidden;
        
        // background-image: url("../../img/test_avatar.png"); // Replace later
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