<template>
    <div class="register">
        <div class="register__header">
            {{ $t('open.register.title') }}
            <hr class="line--red line--bottom-space">
            <hr class="line--red line--bottom-space">
        </div>
        <div class="register_textblock">
            {{ $t('open.register.info1') }} {{ new Date(tournament?.registrations.end || "").toLocaleString('en-US', options) }}. {{ $t('open.register.info2') }}
        </div>
        <div class="register_fields">
            <div class="register_fields_body">
                <div class="register_fields_row">
                    <div class="register_fields_block--label">
                        {{ $t('open.register.teamName') }}
                    </div>
                    <div class="register_fields_block">
                        <input 
                            class="register_fields__input" 
                            type="text"
                        >
                        <div class="register_fields__finetext">
                            {{ $t('open.register.maxCharacters') }}
                        </div>
                    </div>
                </div>
                <div class="register_fields_row">
                    <div class="register_fields_block--label">
                        {{ $t('open.register.teamBanner') }}
                    </div>
                    <div class="register_fields_block">
                        <div class="register_fields_block--inline">
                            <ContentButton class="content_button--red_sm">
                                {{ $t('open.register.upload') }}
                            </ContentButton>
                            <div class="register_fields__finetext--center">
                                {{ $t('open.register.fileSizeLimit') }}
                            </div>
                        </div>
                        <div class="register_fields__finetext--error">
                            {{ $t('open.register.fileSizeError') }}
                        </div>
                    </div>
                </div>
                <div class="register_fields_row">
                    <div class="register_fields_block--label register_fields_block--force-center">
                        {{ $t('open.register.preview') }}
                    </div>
                    <div class="register_fields_block">
                        <img src="https://i.imgur.com/ikZw1Tg.png">
                        <div class="register_fields__finetext--diamonds">
                            {{ $t('open.register.bannersInfo1') }}
                        </div>
                        <div class="register_fields__finetext">
                            {{ $t('open.register.bannersInfo2') }}
                        </div>
                        <div class="register_fields__finetext">
                            {{ $t('open.register.bannersInfo3') }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <hr class="line--gray line--nofill line--even-space">
        <div class="register_fields">
            <div class="register_fields_body">
                <div class="register_fields_row">
                    <div class="register_fields_block--label">
                        {{ $t('open.register.teamManagement') }}
                    </div>
                    <div class="register_fields_block">
                        <div 
                            class="register_fields_block--highlight"
                            v-html="$t('open.register.teamCaptains')" 
                        />
                        <div 
                            class="register_fields_block--highlight"
                            v-html="$t('open.register.teamManagers')" 
                        />
                        <br>
                        <div 
                            class="register_fields_block--highlight"
                            v-html="$t('open.register.selectManager')" 
                        />
                        <div class="register_fields_block--spaced register_fields_block--inline">
                            <input 
                                class="register_fields_block__checkbox"
                                type="checkbox"
                            >
                            <div 
                                class="register_fields__finetext register_fields__finetext--spaced"
                                v-html="$t('open.register.confirmManager')" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="register_submit">
            <ContentButton class="content_button content_button--red_lg">
                {{ $t('open.register.continue') }}
            </ContentButton>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Tournament } from "../../Interfaces/tournament";
import { UserInfo } from "../../Interfaces/user";

import ContentButton from "../../Assets/components/open/ContentButton.vue";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Register extends Vue {
    options: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "30")
        hour: "2-digit", // Two-digit hour (e.g., "23")
        minute: "2-digit", // Two-digit minute (e.g., "59")
        timeZone: "UTC", // Set the time zone to UTC
        timeZoneName: "short", // Abbreviated time zone name (e.g., "UTC")
    };

    @openModule.State tournament!: Tournament | null;

    @State loggedInUser!: null | UserInfo;

    mounted () {
        if (!this.loggedInUser) {
            this.$router.push("/");
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.register {
    background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    width: 75vw;
    align-self: center;
    margin-top: 13px;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 50px 45px 30px 45px;

    &__header {
        font-family: $font-communterssans;
        font-weight: 400;
        font-size: $font-title;
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

        &_body {
            display: table-row-group;
        }

        &_row {
            display: table-row;
        }

        &_block {
            display: table-cell;
            padding: 3px 0px;
            position: relative;
            min-width: 40vw;

            &--label {
                display: table-cell;
                padding-right: 60px;
                color: $open-red;
                font-family: $font-ggsans;
                font-weight: 700;
                font-size: $font-lg;
                text-align: right;
                min-width: 20vw;
            }

            &--force-center {
                    vertical-align: middle;
                    padding-bottom: 2.5em;
                }

            &--inline {
                display: flex;
                flex-direction: row;
            }

            & img {
                border: 1px solid #A0A0A0;
                margin: 5px 0px;
                max-height: 100px;
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
                margin-left: 25px;
                display: flex;
                align-items: center;
                font-family: $font-ggsans;
                font-weight: 500;
                font-style: italic;
            }

            &--spaced {
                margin-left: 15px;
            }

            &--error {
                font-size: $font-sm;
                color: $open-red;
                font-family: $font-ggsans;
                font-weight: 500;
                font-style: italic;
            }

            &--diamonds{
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
