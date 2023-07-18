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
                            <OpenInput 
                                :min="5"
                                :max="20"
                                :placeholder="'name'"
                                :text="name"
                                @input="name = $event"
                            />
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
                            <OpenInput 
                                :min="2"
                                :max="4"
                                :placeholder="'abbreviation'"
                                :text="abbreviation"
                                @input="abbreviation = $event"
                            />
                            <div class="create_fields__finetext">
                                {{ $t('open.create.acronymLength') }}
                            </div>
                        </div>
                    </div>
                    <div class="create_fields_row">
                        <div class="create_fields_block--label">
                            {{ $t('open.create.teamTimezone') }}
                        </div>
                        <div class="create_fields_block">
                            <OpenSelect
                                :value="timezone"
                                :options="timezones"
                                @change="timezone = $event"
                            />
                            <div
                                class="create_fields__finetext"
                                v-html="$t('open.create.timezoneText')" 
                            />
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
                                    class="content_button content_button--red content_button--red_sm content_button_text"
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
                                :src="previewBase64 || require('../../../Assets/img/site/open/team/default.png')"
                            >
                            <div
                                class="create_fields__finetext create_fields__finetext--diamonds"
                                v-html="$t('open.create.avatarInfo1')"
                            />
                            <div class="create_fields__finetext">
                                {{ $t('open.create.avatarInfo2') }}
                            </div>
                            <div class="create_fields__finetext">
                                {{ $t('open.create.avatarInfo3') }}
                            </div>
                            <div class="create_fields__finetext">
                                {{ $t('open.create.avatarInfo4') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="line--gray line--nofill line--even-space">
            <div class="create_fields">
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
                                class="create_fields__finetext create_fields__finetext--spaced create_fields__finetext--clickable"
                                @click="isNotPlaying = !isNotPlaying" 
                                v-html="$t('open.create.confirmManager')" 
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="create_submit">
                <ContentButton 
                    class="content_button content_button--red_lg"
                    @click.native="create"
                >
                    {{ loading ? "Loading..." : $t('open.create.create') }}
                </ContentButton>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Team, validateTeamText } from "../../../Interfaces/team";
import { Tournament } from "../../../Interfaces/tournament";
import { UserInfo } from "../../../Interfaces/user";
import { getTimezoneOffset } from "../../../Server/utils/dateParse";

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenInput from "../../../Assets/components/open/OpenInput.vue";
import OpenSelect from "../../../Assets/components/open/OpenSelect.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        OpenInput,
        OpenSelect,
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
    @openModule.State team!: Team | null;

    @State loggedInUser!: null | UserInfo;

    name = "";
    abbreviation = "";
    isNotPlaying = false;

    loading = false;
    sizeError = false;
    typeError = false;

    timezone = getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone).toString();
    get timezones () {
        let zones: {
            value: string;
            text: string;
        }[] = [];
        for (let i = -12; i <= 14; i++) {
            let prefix = i >= 0 ? "+" : "";
            zones.push({
                value: i.toString(),
                text: `UTC${prefix}${i}:00`,
            });
        }
        return zones;
    }

    previewBase64: string | null = null;
    image = undefined as File | undefined;

    uploadAvatar (e: Event) {
        this.sizeError = false;
        this.typeError = false;
        const target = e.target as HTMLInputElement;
        this.image = target.files?.[0];

        if (!this.image) {
            return;
        }

        // 5 MB limit
        if (this.image.size > 5 * 1024 * 1024) {
            this.sizeError = true;
            return;
        }

        // File type check
        if (!this.image.type.startsWith("image/jpeg") && !this.image.type.startsWith("image/png")) {
            this.typeError = true;
            return;
        }

        // Get image and put into previewBase64
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewBase64 = e.target?.result as string;
        };
        reader.readAsDataURL(this.image);
    }

    mounted () {
        if (!this.loggedInUser?.discord.userID)
            this.$router.push("/");
        else if (this.team)
            this.$router.push(`/team`);
    }

    async create () {
        if (this.loading)
            return;

        this.loading = true;
        if (this.typeError || this.sizeError) {
            alert("Invalid image file. Ensure the image is a PNG or JPG and is less than 5MB.");
            this.loading = false;
            return;
        }

        const timezone = parseInt(this.timezone);
        if (isNaN(timezone) || timezone < -12 || timezone > 14) {
            alert("Invalid timezone.");
            this.loading = false;
            return;
        }

        const validate = validateTeamText(this.name, this.abbreviation);
        if ("error" in validate) {
            alert(validate.error);
            this.loading = false;
            return;
        }

        ({ name: this.name, abbreviation: this.abbreviation } = validate);

        const { data: res } = await this.$axios.post("/api/team/create", {
            name: this.name,
            abbreviation: this.abbreviation,
            isPlaying: !this.isNotPlaying,
            timezoneOffset: timezone,
        });

        if (res.success) {
            if (this.image) {
                const formData = new FormData();
                formData.append("avatar", this.image, this.image.name);
                const { data: resAvatar } = await this.$axios.post(`/api/team/${res.team.ID}/avatar`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                if (resAvatar.error)
                    alert(`Error adding team avatar:\n${resAvatar.error}\n\nYou can try adding a team avatar again on the team page`);
            }

            if (res.error)
                alert(`Error making team:\n${res.error}`);

            this.loading = false;
            this.$store.dispatch("open/setTeam");
            this.$router.push(`/team/${res.team.ID}`);
        } else
            alert(res.error);
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
        align-self: center;

        &_row {
            display: flex;
        }

        &_block {
            padding: 3px 0px;
            position: relative;
            min-width: 40vw;

            &--label {
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
                border: 1px solid $gray;
                margin: 5px 0px;
                width: 9rem;
                height: 3rem;
                object-fit: cover;
            }

            &--highlight {
                font-family: $font-ggsans;
                font-weight: 600;

                & span {
                    display: inline-block;
                    font-weight: 700;
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

            & span {
                font-weight: 700;
                font-style: italic;
                color: $open-red;
            }
        }
    }
}
</style>
