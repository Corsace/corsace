<template>
    <div class="open_card_player">
        <div class="open_card_player_name_group">
            <div class="open_card_player_name_group__img">
                <slot name="player_icon" />
            </div>
            <div class="open_card_player_name_group_data__name">
                <div class="open_card_player_name_group_data__name">
                    <slot name="player_name" />
                </div>
                <div class="open_card_player_name_group_data__country">
                    <div class="open_card_player_name_group_data__country_flag">
                        <slot name="player_flag" />
                    </div>
                    <div class="open_card_player_name_group_data__country_name">
                        <slot name="player_country" />
                    </div>
                </div>
            </div>
        </div> 
        <div class="open_card_player_socials_group">
            <div class="open_card_player_socials_group_text_group">
                <div class="open_card_player_socials_group_text_group_label">
                    BWS RATING
                </div>
                <div class="open_card_player_socials_group_text_group_data">
                    <slot name="player_bws" />
                </div>
                <div class="open_card_player_socials_group_text_group_label--vertical">
                    BWS
                </div>
            </div>
            <div class="open_card_player_socials_group_socials">
                <div class="open_card_player_socials_group_socials__label">
                    SOCIAL LINKS
                </div>
                <div class="open_card_player_socials_group_socials__button">
                    <ContentButton class="content_button--red_sm">
                        osu! PROFILE
                    </ContentButton>
                </div>  
                <div class="open_card_player_socials_group_socials__button">
                    <ContentButton class="content_button--red_sm">
                        TWITTER
                    </ContentButton>  
                </div>
            </div>
        </div>
        <div class="open_card_player_about">
            <div class="open_card_player_about__title">
                ABOUT ME
            </div>
            <div class="open_card_player_about__list">
                <slot name="about_me" />
            </div>
            <div class="open_card_player_about__buttons">
                <div class="open_card_player_about__buttons_button">
                    <ContentButton class="content_button--red">
                        INVITE PLAYER
                    </ContentButton>
                </div>
                <div class="open_card_player_about__buttons_button">
                    <ContentButton class="content_button--red_outline">
                        REVOKE INVITATION
                    </ContentButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import ContentButton from "./ContentButton.vue";

@Component({
    components: {
        ContentButton,
    },
})
export default class OpenCardPlayer extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
.open_card_player {
    margin-right: calc(100% - 384px*3);
    position: relative;
    display: flex;
    flex-direction: column;
    width: 375px;
    height: 440px;
    background: #171B1E;

    &:last-child {
        margin-right: 0;
    }

    &_name_group {
        z-index: 2;
        display: flex;
        flex-direction: row;

        &__img {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 100%);
            margin: 10px;
            width: 105px;
            height: 105px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1px;

            & img {
                width: 103px;
                height: 103px;
                object-fit: cover;
                overflow: hidden;
            }
        }
        &_data {
            display: flex;
            flex-direction: column;
            &__name {
                font-family: gg sans;
                font-size: $font-xl;
                font-weight: 700;
                text-align: left;
                text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
                color: $white;
                margin-top: 7.5px;
            }

            &__country {
                display: flex;
                flex-direction: row;
                margin-top: -5px;

                &_flag {
                    & img {
                        max-width: 25px;
                        max-height: 17px;
                        height: auto;
                    }
                }

                &_name {
                    margin-left: 10px;
                    display: flex;
                    align-items: center;
                    font-family: $font-swis721;
                    font-size: $font-sm;
                    font-weight: 700;
                    text-align: left;
                }


            }
        }
    }

    &_socials_group {
        border-top: 1px solid $open-red;
        margin-top: -50px;
        padding-top: 1px;
        z-index: 1;
        height: 85px;
        display: flex;
        flex-direction: column;
        background: #131313;

        &_text_group {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
            margin-right: 3px;

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

        &_socials {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: -6px;
            margin-right: 6.5px;

            &__button {
                width: 115px;
                margin-left: 10.5px;
            }
            
            &__label {
                font-family: $font-swis721;
                font-size: $font-sm;
                font-weight: 400;
                text-align: right;
                color: #909090;
                margin-right: 5px;
            }
        }
    }

    &_about {
        height: 280px;
        background: #131313;
        border-top: 1px solid $open-red;
        position: relative;
        display: flex;
        flex-direction: column;
        background-image: url('../../../Assets/img/site/open/checkers-bg.png');
        background-repeat: no-repeat;
        background-position: bottom 0px right -5px;
        padding: 17px 20px 0px 20px;

        &__title {
            font-family: $font-ggsans;
            font-size: $font-lg;
            font-weight: 700;
            text-align: left;
            color: $open-red;
        }

        &__list {
            flex-grow: 1;
            & ul {
                font-family: $font-ggsans;
                font-size: $font-lg;
                font-weight: 700;
                text-align: left;
                color: $white;
                list-style-type: none;

            }

            & li {
                margin-bottom: 8px;
                position: relative;

                &::before {
                    content: "";
                    position: absolute;
                    top: 45%;
                    right: calc(100% + 0.75em);
                    width: 4.5px;
                    height: 4.5px;
                    transform: rotate(-45deg);
                    background-color: $open-red;
                }
            }
        }

        &__buttons {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 7px;
            
            &_button {
                width: 160px;
            }
        }
    }
}
</style>