<template>
    <div class="create">
        <div class="create__container">
            <OpenTitle>
                {{ $t('open.create.title') }}
            </OpenTitle>
            <div class="create_textblock">
                {{ $t('open.create.info1') }} {{ new Date(tournament?.registrations.end || "").toLocaleString('en-US', options) }}. {{ $t('open.create.info2') }}
            </div>
            <div class="create_fields">
                <div class="create_fields_body">
                    <div class="create_fields_row">
                        <div class="create_fields_block--label">
                            {{ $t('open.create.teamName') }}
                        </div>
                        <div class="create_fields_block">
                            <input
                                v-model="name"
                                class="create_fields__input" 
                                type="text"
                            >
                            <div class="create_fields__finetext">
                                {{ $t('open.create.teamLength') }}
                            </div>
                        </div>
                    </div>
                    <div class="create_fields_row">
                        <div class="create_fields_block--label">
                            {{ $t('open.create.teamAcronym') }}
                        </div>
                        <div class="create_fields_block">
                            <input
                                v-model="acronym"
                                class="create_fields__input" 
                                type="text"
                            >
                            <div class="create_fields__finetext">
                                {{ $t('open.create.acronymLength') }}
                            </div>
                        </div>
                    </div>
                    <div class="create_fields_row">
                        <div class="create_fields_block--label">
                            {{ $t('open.create.teamAvatar') }}
                        </div>
                        <div class="create_fields_block">
                            <div class="create_fields_block--inline">
                                <label 
                                    for="avatar"
                                    class="content_button content_button--red_sm content_button_text"
                                >
                                    {{ $t('open.create.upload') }}
                                </label>
                                <input 
                                    id="avatar"
                                    type="file"
                                    accept=".jpg, .jpeg, .png"
                                    class="create_fields__avatar_input"
                                    @change="uploadAvatar"
                                >
                                <div class="create_fields__finetext--center">
                                    {{ $t('open.create.fileSizeLimit') }}
                                </div>
                            </div>
                            <div
                                v-if="sizeError"
                                class="create_fields__finetext--error"
                            >
                                {{ $t('open.create.fileSizeError') }}
                            </div>
                            <div
                                v-else-if="typeError"
                                class="create_fields__finetext--error"
                            >
                                {{ $t('open.create.fileTypeError') }}
                            </div>
                            <div 
                                v-else
                                class="create_fields__finetext--center"
                            />
                        </div>
                    </div>
                    <div class="create_fields_row">
                        <div class="create_fields_block--label create_fields_block--force-center">
                            {{ $t('open.create.preview') }}
                        </div>
                        <div class="create_fields_block">
                            <img 
                                class="create_fields_block--image"
                                :src="previewBase64"
                            >
                            <div class="create_fields__finetext--diamonds">
                                {{ $t('open.create.avatarInfo1') }}
                            </div>
                            <div class="create_fields__finetext">
                                {{ $t('open.create.avatarInfo2') }}
                            </div>
                            <div class="create_fields__finetext">
                                {{ $t('open.create.avatarInfo3') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="line--gray line--nofill line--even-space">
            <div class="create_fields">
                <div class="create_fields_body">
                    <div class="create_fields_row">
                        <div class="create_fields_block--label">
                            {{ $t('open.create.teamManagement') }}
                        </div>
                        <div class="create_fields_block">
                            <div 
                                class="create_fields_block--highlight"
                                v-html="$t('open.create.teamManagers')" 
                            />
                            <div 
                                class="create_fields_block--highlight"
                                v-html="$t('open.create.teamManagersFree')"
                            />
                            <br>
                            <div 
                                class="create_fields_block--highlight"
                                v-html="$t('open.create.selectManager')" 
                            />
                            <div class="create_fields_block--spaced create_fields_block--inline">
                                <input 
                                    v-model="isNotPlaying"
                                    class="create_fields_block__checkbox"
                                    type="checkbox"
                                >
                                <div 
                                    class="create_fields__finetext create_fields__finetext--spaced"
                                    v-html="$t('open.create.confirmManager')" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="create_submit">
                <ContentButton 
                    class="content_button content_button--red_lg"
                    @click.native="next"
                >
                    {{ $t('open.create.continue') }}
                </ContentButton>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Tournament } from "../../Interfaces/tournament";
import { UserInfo } from "../../Interfaces/user";
import { profanityFilterStrong } from "../../Interfaces/comment";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        OpenTitle,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Create extends Vue {
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

    name = "";
    acronym = "";
    isNotPlaying = false;

    sizeError = false;
    typeError = false;
    previewBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAQAAACWCMVLAAAAxklEQVR42u3SMQ0AAAzDsJU/6aGo1MOGECUHBZEAY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWBgLjIWxMBYYC2NhLDAWxsJYYCy2PT0vAGXiVAUcAAAAAElFTkSuQmCC";

    uploadAvatar (e: Event) {
        this.sizeError = false;
        this.typeError = false;
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
            return;
        }

        // 5 MB limit
        if (file.size > 5 * 1024 * 1024) {
            this.sizeError = true;
            return;
        }

        // File type check
        if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/png")) {
            this.typeError = true;
            return;
        }

        // Get image and put into previewBase64
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewBase64 = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    mounted () {
        // if (!this.loggedInUser) {
        //     this.$router.push("/");
        // }
    }

    next () {
        console.log(this.name, this.acronym, this.isNotPlaying);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.create {

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
