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
                        :src="teamData.avatarURL || require('../../../Assets/img/corsace.png')"
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
                        <div>#{{ teamData.rank }} Average</div>
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
            v-if="edit"
            @close="edit = false"
        >
            <OpenInput />
        </BaseModal>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Team as TeamInterface } from "../../../Interfaces/team";
import { UserInfo } from "../../../Interfaces/user";

import OpenInput from "../../../Assets/components/open/OpenInput.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../../Assets/components/BaseModal.vue";

const openModule = namespace("open");

@Component({
    components: {
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

    async getTeam (): Promise<TeamInterface | null> {
        this.loading = true;
        if (!this.$route.params.id || parseInt(this.$route.params.id) === this.team?.ID) {
            this.loading = false;
            return this.team;
        }

        const { data: teamData } = await this.$axios.get(`/api/team/${this.$route.params.id}`);
        this.loading = false;
        return teamData.error ? null : teamData;
    }

    async mounted () {
        this.teamData = await this.getTeam();
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
            border-radius: 50%;
            border: 1px solid $gray;
            width: 50px;
            height: 50px;
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
        }

        &_block {
            padding: 0px 0px 5px 0px;
            position: relative;
            min-width: 40vw;
            font-family: $font-ggsans;
            font-weight: 700;
            font-size: $font-lg;

            &--label {
                width: 250px;
                padding-right: 60px;
                padding-bottom: 2.5em;
                color: $open-red;
                font-family: $font-ggsans;
                font-weight: 700;
                font-size: $font-lg;
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
            border-radius: 50%;
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
}
</style>