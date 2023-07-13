<template>
    <div class="team">
        <div class="team__container">
            <OpenTitle>
                <span>GUNGA TEAM NAME</span> <span class="team--acro">(GTN)</span>
            </OpenTitle>
            <div class="team_fields">
                <div class="team_fields_body">
                    <div class="team_fields_row">
                        <div class="team_fields_block--label">
                            {{ $t('open.create.teamName') }}
                        </div>
                        <div class="team_fields_block">
                            TEAM GUNGA NAME
                        </div>
                    </div>
                    <div class="team_fields_row">
                        <div class="team_fields_block--label">
                            {{ $t('open.create.teamAcronym') }}
                        </div>
                        <div class="team_fields_block">
                            GTN
                        </div>
                    </div>
                    <div class="team_fields_row">
                        <div class="team_fields_block--label">
                            {{ $t('open.create.teamAvatar') }}
                        </div>
                        <div class="team_fields_block">
                            <div class="team_fields_block--inline">
                                <img src="https://i.imgur.com/ikZw1Tg.png">
                            </div>
                        </div>
                    </div>
                    <div class="team_fields_row">
                        <div class="team_fields_block--label team_fields_block--force-center">
                            TEAM MEMBERS
                        </div>
                        <div class="team_fields_block">
                            <ul>
                                <li>your mom</li>
                                <li>your mom2</li>
                                <li>your dad</li>
                            </ul>
                        </div>
                    </div>
                    <div class="team_fields_row">
                        <div class="team_fields_block--label team_fields_block--force-center">
                            TEAM MANAGER
                        </div>
                        <div class="team_fields_block">
                            the manager
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";

@Component({
    components: {
        OpenTitle,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class TeamWithID extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.team{
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
    overflow: auto;

    &--acro {
        color: $open-red;
    }

    &__container {
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
        align-self: center;
        display: flex;
        flex-direction: column;
        position: relative;
        width: 75vw;
        padding: 0 43px;
        padding-top: 50px;
    }

    &_textblock {
        font-family: $font-ggsans;
        font-weight: 600;
        margin-top: 30px;
        margin-left: 5px;
        margin-bottom: 25px;
        font-size: $font-lg;
    }

    &_submit {
        align-self: center;
        margin-top: 25px;
        width: 40%;
    }

    &_fields {
        display: table;
        align-self: center;
        margin-top: 25px;

        &_body {
            display: table-row-group;
        }

        &_row {
            display: table-row;
        }

        &_block {
            display: table-cell;
            padding: 0px 0px 5px 0px;
            position: relative;
            min-width: 40vw;
            font-family: $font-ggsans;
            font-weight: 700;
            font-size: $font-lg;

            & ul {
                padding-left: 0px;
                list-style: none;
            }

            &--label {
                display: table-cell;
                padding-right: 60px;
                color: $open-red;
                font-family: $font-ggsans;
                font-weight: 700;
                font-size: $font-lg;
                text-align: right;
                min-width: 20vw;
                vertical-align: middle;
            }

            &--force-center {
                    vertical-align: middle;
                    padding-bottom: 2.5em;
                }

            &--inline {
                display: flex;
            }

            &--image {
                border: 1px solid #A0A0A0;
                margin: 5px 0px;
                max-width: 512px;
                max-height: 512px;
            }

            &--highlight {
                font-family: $font-ggsans;
                font-weight: 600;

                & span {
                    display: inline-block;
                    font-weight: 700;
                    font-family: $font-ggsans;
                    font-style: italic;
                    color: $open-red;
                }

            }

            &--spaced {
                padding-top: 20px;
            }

            &__checkbox {
                cursor: pointer;
                appearance: initial;
                border: 1px solid #696969;
                background: rgba(0, 0, 0, 0.0);
                height: 2rem;
                width: 2rem;
                margin: 0;
                position: relative;

                &:checked {
                    opacity: 1;
                    background: $open-red;

                    &:after {
                        content: "\d7";
                        color: $open-dark;
                        font-size: 3rem;
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        line-height: 2rem;
                        text-align: center;
                    }
                }
            }
        }

        &__avatar_input {
            display: none;
        }

        &__input {
            color: $white;
            outline: none;
            font-family: $font-ggsans;
            font-size: $font-xl;
            font-weight: 800;
            border: 1px solid #696969;
            background: linear-gradient(0deg, #2B2B2B, #2B2B2B), linear-gradient(0deg, #F24141, #F24141);
            height: 2rem;
            min-width: 50%;
            caret-color: $open-red;

            &:invalid {
                color: $open-red;
            }

            &:focus {
                border: 1px solid $open-red;
            }
        }

        &__finetext {
            display: block;
            font-family: $font-ggsans;
            font-weight: 500;
            font-style: italic;
            font-size: $font-sm;

            &--center {
                font-size: $font-sm;
                margin-left: 10px;
                display: flex;
                align-items: center;
                font-family: $font-ggsans;
                font-weight: 500;
                font-style: italic;
            }

            &--spaced {
                padding-left: 15px;
            }

            &--clickable {
                cursor: pointer;
            }

            &--error {
                font-size: $font-sm;
                color: $open-red;
                font-family: $font-ggsans;
                font-weight: 500;
                font-style: italic;
            }

            &--diamonds {
                display: block;
                font-family: $font-ggsans;
                font-weight: 500;
                font-style: italic;
                font-size: $font-sm;
            }

            &--diamonds::before {
                content: "";
                position: absolute;
                top: calc(70% + 4.5px);
                right: calc(100% + 0.75em);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }

            &--diamonds::after {
                content: "";
                position: absolute;
                top: calc(70% + 4.5px);
                right: calc(100% + 1.35em);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }
    }
}
</style>