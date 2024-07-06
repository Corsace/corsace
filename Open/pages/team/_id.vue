<template>
    <div class="team">
        <div
            v-if="teamData"
            class="team__container"
        >
            <OpenTitle>
                {{ teamData.name }} 
                <span class="team--acronym">({{ teamData.abbreviation }})</span>
                {{ $t('open.teams.teamID') }} #{{ teamData.ID }}
                <template 
                    v-if="isCaptain"
                    #right
                >
                    <ContentButton
                        class="content_button--red"
                        @click.native="edit = !edit"
                    >
                        {{ $t('open.teams.editTeamInfo') }}
                    </ContentButton>
                    <ContentButton
                        class="content_button--red"
                        :link="`/team/invites/${teamData.ID}`"
                    >
                        {{ $t('open.teams.headers.teamInvites') }}
                    </ContentButton>
                </template>
                <template
                    v-else-if="myTeams?.some(t => t.ID === teamData.ID)"
                    #right
                >
                    <ContentButton
                        v-if="!teamData.tournaments || teamData.tournaments.length === 0"
                        class="content_button--red"
                        @click.native="leaveTeam"
                    >
                        {{ $t('open.teams.leaveTeam') }}
                    </ContentButton>
                    <ContentButton
                        class="content_button--red"
                        :link="`/team/invites/${teamData.ID}`"
                    >
                        {{ $t('open.teams.headers.teamInvites') }}
                    </ContentButton>
                </template>
            </OpenTitle>
            <div class="team__fields">
                <div class="team__section">
                    TEAM AVATAR
                    <div class="team__avatar_section">
                        <img 
                            class="team__avatar"
                            :src="teamData.avatarURL || require('../../../Assets/img/site/open/team/default.png')"
                        >
                        <!-- TODO: Add avatar editing
                        <div 
                            v-if="isCaptain"
                            class="team__avatar_buttons"
                        >
                            <ContentButton
                                class="content_button--red content_button--disabled"
                            >
                                CROP/RESIZE
                            </ContentButton>
                            <ContentButton
                                class="content_button--red content_button--margin"
                                @click.native="editAvatar = !editAvatar"
                            >
                                CHANGE PHOTO
                            </ContentButton>
                        </div> -->
                        <div v-if="isCaptain">
                            <p>Images must be in jpg/jpeg/png, 3:1 aspect ratio, and does not exceed 5MB.</p>
                            <p>Any team name, and avatar deemed inappropriate by staff must be changed.</p>
                            <p>Team editing will be locked at the end of the registration period.</p>
                        </div>
                    </div>
                </div>
                <hr class="line--red">
                <div class="team__section">
                    TEAM INFORMATION
                    <div class="team__info_section">
                        <div>
                            <span class="team__info_section--header">{{ $t('open.teams.headers.tournaments') }}</span>
                            <div v-if="(teamData.tournaments?.length ?? -1) > 0">
                                {{ teamData.tournaments?.map(t => t.name).join(", ") }}
                            </div>
                            <div v-else>
                                {{ $t('open.teams.registration.noRegistration') }}
                                <br>
                                {{ myTeams?.some(t => t.ID === teamData?.ID) ? $t('open.teams.registration.toPlay') : '' }}
                            </div>
                        </div>
                        <div>
                            <span class="team__info_section--header">{{ $t('open.teams.headers.teamStats') }}</span>
                            <div>{{ $t('open.teams.teamID') }} #{{ teamData.ID }}</div>
                            <div>{{ teamData.members.length }} {{ teamData.members.length === 1 ? $t('open.teams.member') : $t('open.teams.members') }}</div>
                            <div>{{ Math.round(teamData.BWS) }} {{ $t('open.teams.averageBWS') }}</div>
                            <div>#{{ Math.round(teamData.rank) }} {{ $t('open.teams.averageRank') }}</div>
                            <div>{{ Math.round(teamData.pp) }} {{ $t('open.teams.averagePP') }}</div>
                        </div>
                        <div>
                            <span class="team__info_section--header">{{ $t('open.create.teamTimezone') }}</span>
                            <div>UTC{{ teamData.timezoneOffset >= 0 ? "+" : "" }}{{ teamData.timezoneOffset }}:00</div>
                        </div>
                        <div>
                            <span class="team__info_section--header">{{ $t('open.teams.headers.qualifier') }}</span>
                            <NuxtLink 
                                v-if="teamData?.qualifier"
                                style="text-decoration: none;"
                                :to="'/qualifier/' + teamData.qualifier.ID"
                            >
                                <div>{{ $t("open.teams.qualifierId") }} #{{ teamData.qualifier.ID }}</div>
                                <div>{{ teamData.qualifier.date.toLocaleString('en-US', optionsUTC) }} ({{ teamData.qualifier.date.toLocaleString('en-US', options) }})</div>
                            </NuxtLink>
                            <div v-else-if="isCaptain && tournament">
                                <div class="team_fields--clickable">
                                    {{ tournament.minTeamSize === tournament.maxTeamSize ? $t('open.teams.headers.requiredMessageExact', {minTeamSize: tournament.minTeamSize}) : $t('open.teams.headers.requiredMessageRange', {minTeamSize: tournament.minTeamSize, maxTeamSize: tournament.maxTeamSize}), }}
                                </div>
                            </div>
                            <div 
                                v-else
                            >
                                {{ $t('open.teams.notRegistered') }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="team__section team__players_section">
                    <div class="team__players_header">
                        <span class="team__players_header--title">PLAYERS</span>
                        <ContentButton
                            v-if="isCaptain && teamData.qualifier && !teamData.qualifier.mp"
                            class="content_button--red content_button--noflex"
                            @click.native="unregister"
                        >
                            {{ $t('open.teams.deleteTeam') }}
                        </ContentButton>
                        <ContentButton
                            v-else-if="isCaptain && tournament && tournament.minTeamSize <= teamData.members.length && tournament.maxTeamSize >= teamData.members.length && !teamData.qualifier?.mp"
                            class="content_button--red content_button--noflex"
                            @click.native="editQualifier = !editQualifier" 
                        >
                            {{ teamData.qualifier && !teamData.qualifier.mp ? $t('open.teams.editQualifierTime') : !teamData.qualifier ? $t('open.teams.createJoinQualifier') : '' }}
                        </ContentButton>
                        <ContentButton
                            v-else-if="isCaptain && tournament && !teamData.qualifier?.mp"
                            class="content_button--red content_button--noflex content_button--disabled"
                        >
                            JOIN QUALIFIERS {{ teamData.members.length < tournament.minTeamSize ? "(You need at least " + (tournament.minTeamSize - teamData.members.length) + " more players)" : teamData.members.length > tournament.maxTeamSize ? "(You need at least " + (teamData.members.length - tournament.maxTeamSize) + " less players)" : "" }}
                        </ContentButton>
                    </div>
                    <div class="team__players">
                        <a 
                            v-for="member in teamMembers"
                            :key="member.ID"
                            :href="`https://osu.ppy.sh/users/${member.osuID}`"
                            target="_blank"
                            class="team__players_player"
                        >
                            <img 
                                class="team__players_player--avatar"
                                :src="`https://a.ppy.sh/${member.osuID}`"
                            >
                            <div class="team__players_player--info">
                                <div class="team__players_player--name">
                                    {{ member.username }}   
                                </div>
                                <div class="team__players_player--misc">
                                    <img 
                                        class="team__players_player--country"
                                        :src="`https://osu.ppy.sh/images/flags/${member.country}.png`"
                                    >
                                    <div
                                        v-if="member.ID === teamData.captain.ID" 
                                        class="team__players_player--captain"
                                    >
                                        CAPTAIN
                                    </div>
                                </div>
                            </div>
                            <div class="team__players_player--rank">
                                #{{ Math.round(member.rank) }}
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div 
            v-else-if="loading"
            class="team__container"
        >
            <OpenTitle>
                {{ $t("open.status.loading") }}...
            </OpenTitle>
        </div>
        <div 
            v-else
            class="team__container"
        >
            <OpenTitle>
                NO TEAM FOUND
            </OpenTitle>
        </div>
        <div
            v-if="teamData && !teamData.qualifier?.mp && isCaptain"
            class="team__delete"
            @click="deleteTeam"
        >
            {{ $t('open.teams.edit.deleteTeam') }}?
        </div>
        <!-- Team Edit Modal -->
        <BaseModal
            v-if="edit && teamData && teamData.captain.ID === loggedInUser?.ID"
            @close="edit = false"
        >
            <div class="team__fields team__edit">
                <div class="team__section">
                    <div class="team_fields_block--label team_fields_block--edit">
                        {{ $t('open.teams.edit.teamName') }}
                    </div>
                    <div class="team_fields_block">
                        <OpenInput 
                            :min="5"
                            :max="20"
                            :placeholder="`${$t('open.teams.placeholders.name')}`"
                            :text="name"
                            class="team__input"
                            @input="name = $event"
                        />
                    </div>
                </div>
                <div class="team__section">
                    <div class="team_fields_block--label team_fields_block--edit">
                        {{ $t('open.teams.edit.teamAbbreviation') }}
                    </div>
                    <div class="team_fields_block">
                        <OpenInput 
                            :min="2"
                            :max="4"
                            :placeholder="`${$t('open.teams.placeholders.abbreviation')}`"
                            :text="abbreviation"
                            class="team__input"
                            @input="abbreviation = $event"
                        />
                    </div>
                </div>
                <div class="team__section">
                    <div>
                        {{ $t('open.teams.edit.timezone') }}
                    </div>
                    <div
                        v-html="$t('open.create.timezoneText')" 
                    />
                    <div class="team_fields_block">
                        <OpenSelect
                            class="team__input"
                            :value="timezone"
                            :options="timezones"
                            @change="timezone = $event"
                        />
                    </div>
                </div>
                <div class="team__section">
                    <div class="team_fields_block--label team_fields_block--edit">
                        {{ $t('open.teams.edit.teamAvatar') }}
                    </div>
                    <div
                        class="team_fields_block--edit"
                        v-html="$t('open.create.avatarInfo1')"
                    />
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
                            style="display: none;"
                            @change="uploadAvatar"
                        >

                        <img 
                            class="team__title_avatar"
                            :src="previewBase64 || require('../../../Assets/img/site/open/team/default.png')"
                        >

                        <div
                            v-if="image" 
                            class="team_fields_block--edit"
                        >
                            {{ image?.name }}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="team__fields">
                <div 
                    v-if="sizeError" 
                    class="team__edit"
                >
                    {{ $t('open.teams.edit.errors.size') }}
                </div>
                <div 
                    v-if="typeError"
                    class="team__edit"
                >
                    {{ $t('open.teams.edit.errors.type') }}
                </div>
            </div>
            <ContentButton
                class="content_button--red content_button--red_sm team_fields_block--edit"
                @click.native="saveEdit"
            >
                {{ $t('open.teams.edit.save') }}
            </ContentButton>
        </BaseModal>
        <!-- Qualifier Edit Modal -->
        <QualifierModal
            v-if="editQualifier && teamData && teamData.captain.ID === loggedInUser?.ID"
            :team="teamData"
            @close="closeQualifierEdit"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Team as TeamInterface, TeamUser, validateTeamText } from "../../../Interfaces/team";
import { User, UserInfo } from "../../../Interfaces/user";
import { Tournament } from "../../../Interfaces/tournament";

import { getTimezoneOffset } from "../../../Server/utils/dateParse";

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenInput from "../../../Assets/components/open/OpenInput.vue";
import OpenSelect from "../../../Assets/components/open/OpenSelect.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../../Assets/components/BaseModal.vue";
import QualifierModal from "../../../Assets/components/open/QualifierModal.vue";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        OpenInput,
        OpenSelect,
        OpenTitle,
        BaseModal,
        QualifierModal,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament?.description || ""},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament?.description || ""},
                {hid: "og:image",property: "og:image", content: require("../../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament?.description || ""},
                {name: "twitter:image", content: require("../../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../../Assets/img/site/open/banner.png")},  
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
    validate ({ params }) {
        return !params.id || !isNaN(parseInt(params.id));
    },
})
export default class Team extends Vue {
    @State loggedInUser!: null | UserInfo;

    @openModule.State tournament!: Tournament | null;
    @openModule.State myTeams!: TeamInterface[] | null;

    optionsUTC: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "30")
        hour: "2-digit", // Two-digit hour (e.g., "23")
        hour12: false, // 24-hour format hour
        minute: "2-digit", // Two-digit minute (e.g., "59")
        timeZone: "UTC", // Set the time zone to UTC
        timeZoneName: "short", // Abbreviated time zone name (e.g., "UTC")
    };
    options: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "30")
        hour: "2-digit", // Two-digit hour (e.g., "23")
        hour12: false, // 24-hour format hour
        minute: "2-digit", // Two-digit minute (e.g., "59")
        timeZoneName: "short", // Abbreviated time zone name (e.g., "UTC")
    };

    edit = false;
    editMembers = false;
    editInvites = false;
    editQualifier = false;

    loading = false;
    teamData: TeamInterface | null = null;

    name = "";
    abbreviation = "";
    timezone = "";

    sizeError = false;
    typeError = false;
    previewBase64: string | null = null;
    image = undefined as File | undefined;

    users: User[] = [];

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

    get teamMembers () {
        if (!this.teamData)
            return [];

        const members = this.teamData.members;
        if (!members.some(m => m.ID === this.teamData!.captain.ID))
            members.unshift(this.teamData.captain);
        return members;
    }

    async getTeam (refresh: boolean): Promise<TeamInterface | null> {
        this.loading = true;
        if (refresh)
            await this.$store.dispatch("open/setMyTeams");

        if (!this.$route.params.id) {
            this.loading = false;
            return this.myTeams?.[0] ?? null;
        }

        if (this.myTeams && this.myTeams.some(t => t.ID === parseInt(this.$route.params.id))) {
            this.loading = false;
            return this.myTeams.find(t => t.ID === parseInt(this.$route.params.id)) ?? null;
        }

        const { data } = await this.$axios.get<{ team: TeamInterface }>(`/api/team/${this.$route.params.id}`);
        if (!data.success) {
            alert(data.error);
            this.loading = false;
            return null;
        }
        const teamData = data.team;
        if (teamData?.qualifier)
            teamData.qualifier.date = new Date(teamData.qualifier.date);
        this.loading = false;
        return teamData;
    }

    async mounted () {
        this.teamData = await this.getTeam(false);
        this.name = this.teamData?.name ?? "";
        this.abbreviation = this.teamData?.abbreviation ?? "";
        this.timezone = this.teamData?.timezoneOffset.toString() ?? getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone).toString();
        this.previewBase64 = this.teamData?.avatarURL ?? null;
    }

    get isCaptain (): boolean {
        return this.teamData?.captain.ID === this.loggedInUser?.ID;
    }

    async leaveTeam () {
        if (!this.teamData)
            return;
        const { data } = await this.$axios.post(`/api/team/${this.teamData.ID}/leave`);
        if (!data.success)
            return alert(data.error);
        await this.$store.dispatch("open/setMyTeams");
        await this.getTeam(true);
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
        if (!this.teamData || (!this.image && this.name === this.teamData.name && this.abbreviation === this.teamData.abbreviation && parseInt(this.timezone) === this.teamData.timezoneOffset)) {
            this.edit = false;
            return;
        }

        if (this.typeError || this.sizeError) {
            alert(this.$t("open.teams.edit.errors.invalidImage"));
            return;
        }

        if (this.image && this.name === this.teamData.name && this.abbreviation === this.teamData.abbreviation && parseInt(this.timezone) === this.teamData.timezoneOffset) {
            await this.saveAvatar();
            this.teamData = await this.getTeam(true);
            this.edit = false;
            return;
        }

        const timezone = parseInt(this.timezone);
        if (isNaN(timezone) || timezone < -12 || timezone > 14) {
            alert(this.$t("open.teams.edit.errors.invalidTimezone"));
            this.loading = false;
            return;
        }

        const validate = validateTeamText(this.name, this.abbreviation);
        if ("error" in validate) {
            alert(validate.error);
            return;
        }

        ({ name: this.name, abbreviation: this.abbreviation } = validate);

        const { data: res } = await this.$axios.patch(`/api/team/${this.teamData.ID}`, {
            name: this.name,
            abbreviation: this.abbreviation,
            timezoneOffset: timezone,
        });

        if (res.success)
            await this.saveAvatar();
        else
            alert(res.error);

        this.teamData = await this.getTeam(true);
        this.edit = false;
    }

    async saveAvatar () {
        if (!this.image || !this.teamData)
            return;
    
        const formData = new FormData();
        formData.append("avatar", this.image, this.image.name);

        const { data: resAvatar } = await this.$axios.post(`/api/team/${this.teamData.ID}/avatar`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        this.image = undefined;
    
        if (!resAvatar.success) {
            alert(this.$t("open.teams.edit.errors.errorAddingTeamAvatar", { error: resAvatar.error }));
            this.teamData = await this.getTeam(true);
            return;
        }
    }

    async deleteTeam () {
        if (!this.teamData)
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.deleteTeam") as string))
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.deleteTeamFinal") as string))
            return;

        const { data: res } = await this.$axios.delete(`/api/team/${this.teamData.ID}`);

        if (res.success) {
            await this.$store.dispatch("open/setMyTeams");
            await this.$router.push("/team/create");
        } else
            alert(res.error);
    }

    async removeMember (user: TeamUser) {
        if (!this.teamData)
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.removeMember", {username: user.username}) as string))
            return;

        const { data: res } = await this.$axios.post(`/api/team/${this.teamData.ID}/remove/${user.ID}`);

        if (res.success)
            this.teamData = await this.getTeam(true);
        else
            alert(res.error);
    }

    async transferCaptain (user: TeamUser) {
        if (!this.teamData)
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.transferCaptain", {username: user.username}) as string))
            return;

        const { data: res } = await this.$axios.post(`/api/team/${this.teamData.ID}/captain/${user.ID}`);

        if (res.success) {
            this.teamData = await this.getTeam(true);
            this.editMembers = false;
        } else
            alert(res.error);
    }

    // async captainToggle () {
    //     if (!this.isCaptain || !this.teamData)
    //         return;

    //     const { data: res } = await this.$axios.post(`/api/team/${this.teamData.ID}/captain`);

    //     if (res.success)
    //         this.teamData = await this.getTeam(true);
    //     else
    //         alert(res.error);
    // }

    async unregister () {
        if (!this.teamData || !this.tournament)
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.unregister") as string))
            return;

        const { data: res } = await this.$axios.post(`/api/team/${this.teamData.ID}/unregister`, {
            tournamentID: this.tournament.ID,
        });

        if (res.success)
            this.teamData = await this.getTeam(true);
        else
            alert(res.error);
    }

    async closeQualifierEdit (get: boolean) {
        this.editQualifier = false;
        if (get)
            this.teamData = await this.getTeam(true);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.team {
    position: relative;
    overflow: auto;

    &--acronym {
        color: $open-red;
    }

    &__container {
        align-self: center;
        display: flex;
        flex-direction: column;
        position: relative;
        width: 75vw;
        padding: 0 43px;
        padding-top: 50px;
    }

    &__fields {
        margin-top: 18px;
    }

    &__section {
        font-weight: bold;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    &__avatar {
        height: 100px;
        width: 300px;
        object-fit: cover;

        &_section {
            display: flex;
            gap: 23px;
            font-weight: normal;
        }   
    }

    &__info_section {
        display: flex;
        gap: 23px;
        font-weight: normal;

        &--header {
            font-weight: bold;
        }
    }

    &__players {
        display: flex;
        flex-wrap: wrap;
        font-weight: bold;
        gap: 50px;

        &_section {
            gap: 38px;
            margin-top: 38px;
        }

        &_header {
            display: flex;
            align-items: center;
            gap: 32px;
            font-weight: bold;

            &--title {
                flex: 1;
                background-color: $open-red;
                padding: 5px;
            }
        }

        &_player {
            position: relative;
            display: flex;
            gap: 12px;
            background-color: #FAFAFA;
            color: #131313;
            width: 215px;

            &:hover {
                text-decoration: none;
                box-shadow: 0px 0px 8px 4px $darker-gray;
            }

            &--avatar {
                height: 93px;
                width: 74px;
                object-fit: cover;
                border-right: 1px solid $open-red;
            }

            &--info {
                display: flex;
                flex-direction: column;
                margin-top: 5px;
                gap: 5px;
            }

            &--name {
                font-size: 20px;
                font-weight: bold;
            }
            
            &--misc {
                display: flex;
                align-items: center;
                gap: 7px;
            }

            &--country {
                height: 11px;
                box-shadow: 0 0 1px 0 #000;
            }

            &--captain {
                font-size: 12px;
                font-stretch: condensed;
                font-weight: normal;
            }

            &--rank {
                position: absolute;
                color: $open-red;
                bottom: 0;
                right: 0;
                padding: 5px;
                font-weight: bold;
                font-stretch: condensed;
                font-size: 18px;
            }
        }
    }

    &__edit {
        display: flex;
        gap: 40px;
        flex-direction: column;
    }

    &__delete {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        margin-bottom: 20px;
        color: $open-red;
        letter-spacing: 0.23em;
        cursor: pointer;
        text-align: center;
    }
}
</style>