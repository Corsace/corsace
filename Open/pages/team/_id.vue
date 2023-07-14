<template>
    <div class="team">
        <div
            v-if="teamData"
            class="team__container"
        >
            <OpenTitle>
                <div class="team__title">
                    <img 
                        class="team__title_avatar"
                        :src="teamData.avatarURL || require('../../../Assets/img/site/open/team/default.png')"
                    > 
                    <span>{{ teamData.name.toUpperCase() }}</span>
                    <span class="team--acronym">({{ teamData.abbreviation.toUpperCase() }})</span>
                </div>
                <div
                    v-if="teamData.manager.ID === loggedInUser?.ID"
                    class="team_fields--clickable"
                    @click="edit = !edit"
                >
                    {{ !edit ? "edit team info" : "" }}
                </div>
            </OpenTitle>
            <div class="team_fields">
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        TEAM STATS
                    </div>
                    <div class="team_fields_block">
                        <div>{{ teamData.members.length }} member{{ teamData.members.length === 1 ? "" : "s" }}</div>
                        <div>{{ teamData.BWS }} Average BWS</div>
                        <div>#{{ teamData.rank }} Average Rank</div>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        TEAM MANAGER
                    </div>
                    <div class="team_fields_block team__member_list">
                        <a
                            class="team__member"
                            :href="'https://osu.ppy.sh/users/' + teamData.manager.osuID"
                        >
                            <img
                                v-if="teamData.manager.isManager"
                                class="team__member_manager"
                                src="../../../Assets/img/site/open/team/manager.svg"
                            >
                            <div 
                                v-else 
                                class="team__member_manager"
                            />
                            <img 
                                class="team__member_avatar"
                                :src="`https://a.ppy.sh/${teamData.manager.osuID}`"
                            >
                            <div class="team__member_name">
                                {{ teamData.manager.username }}
                            </div>
                            <div class="team__member_bws">
                                {{ teamData.manager.BWS }} BWS
                            </div>
                        </a>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        TEAM MEMBERS
                        <div v-if="teamData.ID === team?.ID">
                            <div class="team_fields--clickable">
                                edit team members
                            </div>
                            <div class="team_fields--clickable">
                                invite team members
                            </div>
                        </div>
                    </div>
                    <div class="team_fields_block team__member_list">
                        <a
                            v-for="member in teamData.members"
                            :key="member.ID"
                            class="team__member"
                            :href="'https://osu.ppy.sh/users/' + member.osuID"
                        >
                            <img
                                v-if="member.isManager"
                                class="team__member_manager"
                                src="../../../Assets/img/site/open/team/manager.svg"
                            >
                            <div 
                                v-else 
                                class="team__member_manager"
                            />
                            <img 
                                class="team__member_avatar"
                                :src="`https://a.ppy.sh/${member.osuID}`"
                            >
                            <div class="team__member_name">
                                {{ member.username }}
                            </div>
                            <div class="team__member_bws">
                                {{ member.BWS }} BWS
                            </div>
                        </a>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        TEAM INVITES
                        <div v-if="teamData.ID === team?.ID">
                            <div class="team_fields--clickable">
                                add team invite
                            </div>
                            <div class="team_fields--clickable">
                                removed team invite
                            </div>
                        </div>
                    </div>
                    <div class="team_fields_block team__member_list">
                        <a
                            v-for="member in teamData.invites"
                            :key="member.ID"
                            class="team__member"
                            :href="'https://osu.ppy.sh/users/' + member.osuID"
                        >
                            <div class="team__member_manager" />
                            <img 
                                class="team__member_avatar"
                                :src="`https://a.ppy.sh/${member.osuID}`"
                            >
                            <div class="team__member_name">
                                {{ member.username }}
                            </div>
                            <div class="team__member_bws">
                                {{ member.BWS }} BWS
                            </div>
                        </a>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        QUALIFIER
                        <div v-if="teamData.ID === team?.ID">
                            <div class="team_fields--clickable">
                                create/join qualifier
                            </div>
                            <div class="team_fields--clickable">
                                edit qualifier time
                            </div>
                        </div>
                    </div>
                    <div class="team_fields_block">
                        <div>your mom</div>
                        <div>your mom2</div>
                        <div>your dad</div>
                    </div>
                </div>
            </div>
        </div>
        <div 
            v-else-if="loading"
            class="team__container"
        >
            <OpenTitle>
                <div class="team__title">
                    <img 
                        class="team__title_avatar"
                        src="../../../Assets/img/corsace.png"
                    > 
                    <span>LOADING...</span>
                </div>
            </OpenTitle>
        </div>
        <div 
            v-else
            class="team__container"
        >
            <OpenTitle>
                <div class="team__title">
                    <img 
                        class="team__title_avatar"
                        src="../../../Assets/img/corsace.png"
                    > 
                    <span>NO TEAM FOUND</span>
                </div>
            </OpenTitle>
        </div>
        <BaseModal
            v-if="edit && teamData && teamData.manager.ID === loggedInUser?.ID"
            @close="edit = false"
        >
            <div class="team_fields">
                <div class="team_fields_row">
                    <div class="team_fields_block--label team_fields_block--edit">
                        TEAM NAME
                    </div>
                    <div class="team_fields_block">
                        <OpenInput 
                            :min="5"
                            :max="20"
                            :placeholder="'name'"
                            :text="name"
                            class="team__input"
                            @input="name = $event"
                        />
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label team_fields_block--edit">
                        TEAM ABBREVIATION
                    </div>
                    <div class="team_fields_block">
                        <OpenInput 
                            :min="2"
                            :max="4"
                            :placeholder="'abbreviation'"
                            :text="abbreviation"
                            class="team__input"
                            @input="abbreviation = $event"
                        />
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label team_fields_block--edit">
                        TEAM AVATAR
                    </div>
                    <div class="team_fields_block team_fields_block__avatar_block">
                        <label 
                            for="avatar"
                            class="content_button content_button--red content_button--red_sm content_button_text team_fields_block--edit"
                        >
                            {{ $t('open.create.upload') }}
                        </label>
                        <input 
                            id="avatar"
                            type="file"
                            accept=".jpg, .jpeg, .png"
                            class="team__input_avatar"
                            @change="uploadAvatar"
                        >

                        <img 
                            class="team__title_avatar"
                            :src="previewBase64 || require('../../../Assets/img/site/open/team/default.png')"
                        >

                        <div class="team_fields_block--edit">
                            {{ image?.name }}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="team_fields_block">
                <div 
                    v-if="sizeError" 
                    class="team_fields_block--edit"
                >
                    Image is too large. Ensure the image is less than 5MB.
                </div>
                <div 
                    v-if="typeError"
                    class="team_fields_block--edit"
                >
                    Invalid image file. Ensure the image is a PNG or JPG.
                </div>
            </div>
            <ContentButton
                class="content_button--red content_button--red_sm team_fields_block--edit"
                @click.native="saveEdit"
            >
                SAVE
            </ContentButton>
            <ContentButton
                class="content_button--red content_button--red_sm team_fields_block--edit"
                @click.native="deleteTeam"
            >
                DELETE TEAM
            </ContentButton>
        </BaseModal>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Team as TeamInterface, validateTeamText } from "../../../Interfaces/team";
import { UserInfo } from "../../../Interfaces/user";

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenInput from "../../../Assets/components/open/OpenInput.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../../Assets/components/BaseModal.vue";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        OpenInput,
        OpenTitle,
        BaseModal,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
    validate ({ params }) {
        return !params.id || !isNaN(parseInt(params.id));
    },
})
export default class Team extends Vue {
    @State loggedInUser!: null | UserInfo;
    @openModule.State team!: TeamInterface | null;

    edit = false;
    loading = false;
    teamData: TeamInterface | null = null;

    name = "";
    abbreviation = "";

    sizeError = false;
    typeError = false;
    previewBase64: string | null = null;
    image = undefined as File | undefined;

    async getTeam (refresh: boolean): Promise<TeamInterface | null> {
        this.loading = true;
        if (!this.$route.params.id || parseInt(this.$route.params.id) === this.team?.ID) {
            if (refresh)
                await this.$store.dispatch("open/setTeam");
            this.loading = false;
            return this.team;
        }

        const { data: teamData } = await this.$axios.get(`/api/team/${this.$route.params.id}`);
        this.loading = false;
        return teamData.error ? null : teamData;
    }

    async mounted () {
        this.teamData = await this.getTeam(false);
        this.name = this.teamData?.name || "";
        this.abbreviation = this.teamData?.abbreviation || "";
        this.previewBase64 = this.teamData?.avatarURL || null;
    }

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

    async saveEdit () {
        if (!this.teamData || (!this.image && this.name === this.teamData.name && this.abbreviation === this.teamData.abbreviation)) {
            return;
        }

        if (this.typeError || this.sizeError) {
            alert("Invalid image file. Ensure the image is a PNG or JPG and is less than 5MB.");
            return;
        }

        const validate = validateTeamText(this.name, this.abbreviation);
        if (validate.error) {
            alert(validate.error);
            return;
        }

        ({ name: this.name, abbreviation: this.abbreviation } = validate);

        const { data: res } = await this.$axios.patch(`/api/team/${this.teamData.ID}`, {
            name: this.name,
            abbreviation: this.abbreviation,
        });

        if (res.success) {
            if (this.image) {
                const formData = new FormData();
                formData.append("avatar", this.image, this.image.name);
                const { data: resAvatar } = await this.$axios.post(`/api/team/${this.teamData.ID}/avatar`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                this.image = undefined;
                if (resAvatar.error) {
                    alert(`Error adding team avatar:\n${resAvatar.error}`);
                    this.teamData = await this.getTeam(true);
                    return;
                }
            }
        } else
            alert(res.error);

        this.teamData = await this.getTeam(true);
        this.edit = false;
    }

    async deleteTeam () {
        if (!this.teamData)
            return;

        if (!confirm("Are you sure you want to delete this team?"))
            return;

        if (!confirm("Are you REALLY sure you want to delete this team? This can't be undone!"))
            return;

        const { data: res } = await this.$axios.delete(`/api/team/${this.teamData.ID}`);

        if (res.success) {
            await this.$store.dispatch("open/setTeam");
            this.$router.push("/team/create");
        } else
            alert(res.error);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.team {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
    overflow: auto;

    &--acronym {
        color: $open-red;
    }

    &__title {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;

        &_avatar {
            border: 1px solid $gray;
            width: 9rem;
            height: 3rem;
            object-fit: cover;

            &_input {
                display: none;
            }
        }
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

    &_fields {
        margin-top: 25px;

        &_row {
            display: flex;
            margin-bottom: 2.5rem
        }

        &_block {
            padding: 0px 0px 5px 0px;
            position: relative;
            min-width: 40vw;
            font-family: $font-ggsans;
            font-weight: 700;
            font-size: $font-lg;

            &__avatar_block {
                display: flex;
                gap: 20px;
                align-items: center;
            }

            &--label {
                width: 250px;
                padding-right: 60px;
                color: $open-red;
                font-family: $font-ggsans;
                font-weight: 700;
                font-size: $font-lg;
            }

            &--edit {
                text-shadow: none;
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

        }

        &--clickable {
            font-weight: 400;
            font-size: $font-sm;
            color: $gray;
            margin-top: -5px;

            &:hover {
                text-decoration: none;
                color: $white;
                cursor: pointer;
            }
        }
    }

    &__member {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        &:hover {
            text-decoration: none;
        }

        &_list {
            display: flex;
            flex-wrap: wrap;
        }

        &_avatar {
            border: 1px solid $gray;
            width: 50px;
            height: 50px;
            object-fit: cover;
        }

        &_name {
            font-family: $font-ggsans;
            font-weight: 700;
            font-size: $font-lg;
        }

        &_bws {
            font-family: $font-ggsans;
            font-weight: 700;
            font-size: $font-lg;
            color: $open-red;
        }

        &_manager {
            width: 20px;
            height: 20px;
        }
    }

    &__input {
        display: flex;
        margin: 5px 0;

        &_avatar {
            display: none;
        }
    }
}
</style>