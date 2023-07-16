<template>
    <div class="open_card_team">
        <div class="open_card_team__img">
            <slot name="team_banner" />
        </div>
        <div class="open_card_team__name">
            <slot name="team_name" />
        </div>
        <div class="open_card_team__text">
            <div class="open_card_team__text_group">
                <div class="open_card_team__text_group_label">
                    RANK
                </div>
                <div class="open_card_team__text_group_data">
                    <slot name="team_rank" />
                </div>
            </div>
            <div class="open_card_team__text_group">
                <div class="open_card_team__text_group_label">
                    TEAM BWS AVG
                </div>
                <div class="open_card_team__text_group_data">
                    <slot name="team_avg_bws" />
                </div>
                <div class="open_card_team__text_group_label--vertical">
                    BWS
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class OpenCardTeam extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
.open_card_team {
    margin-right: calc(100% - 384px*3);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 375px;
    height: 200px;
    background: #171B1E;

    &:last-child {
        margin-right: 0;
    }

    &__img {
        & img {
            width: 100%;
            height: 120px;
            object-fit: cover;
            overflow: hidden;
        }
    }

    &__name {
        font-family: gg sans;
        font-size: $font-xl;
        font-weight: 700;
        text-align: left;
        text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
        color: $white;
        margin-left: 15px;
        margin-top: -35px;
    }

    &__text {
        height: 57px;
        background: #131313;
        border-top: 1px solid $open-red;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-image: url('../../../Assets/img/site/open/checkers-bg.png');
        background-repeat: no-repeat;
        background-position: bottom 0px right -5px;

        &_group {
            padding: 0 10px 0 10px;
            display: flex;
            flex-direction: row;
            align-items: center;

            &_label {
                color: #131313;
                font-family: $font-swis721;
                font-size: 0.85rem;
                font-weight: 700;
                text-align: left;
                height: inherit;
                background: $open-red;
                padding: 1.75px 3.5px;

                &--vertical {
                    font-family: $font-swis721;
                    font-weight: 400;
                    font-size: $font-sm;
                    font-style: italic;
                    color: $open-red;
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            }

            &_data {
                font-family: $font-swis721;
                font-size: $font-xxxl;
                font-weight: 700;
                font-style: italic;
                margin: 0px 10px 0px 10px
            }
        }
    }
}
</style>