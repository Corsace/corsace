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
                    <span>{{ teamData.name }}</span>
                    <span class="team--acronym">({{ teamData.abbreviation }})</span>
                </div>
                <div
                    v-if="isCaptain"
                    class="team_fields--clickable"
                    @click="edit = !edit"
                >
                    {{ !edit ? $t('open.teams.editTeamInfo') : "" }}
                </div>
            </OpenTitle>
            <div class="team_fields">
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        {{ $t('open.teams.headers.tournaments') }}
                    </div>
                    <div class="team_fields_block">
                        <div v-if="(teamData.tournaments?.length ?? -1) > 0">
                            {{ teamData.tournaments?.map(t => t.name).join(", ") }}
                        </div>
                        <div v-else>
                            {{ $t('open.teams.registration.noRegistration') }}
                            <br>
                            {{ $t('open.teams.registration.toPlay') }}
                        </div>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        {{ $t('open.teams.headers.teamStats') }}
                    </div>
                    <div class="team_fields_block">
                        <div>{{ $t('open.teams.teamID') }} #{{ teamData.ID }}</div>
                        <div>{{ teamData.members.length }} {{ teamData.members.length === 1 ? $t('open.teams.member') : $t('open.teams.members') }}</div>
                        <div>{{ Math.round(teamData.BWS) }} {{ $t('open.teams.averageBWS') }}</div>
                        <div>#{{ Math.round(teamData.rank) }} {{ $t('open.teams.averageRank') }}</div>
                        <div>{{ Math.round(teamData.pp) }} {{ $t('open.teams.averagePP') }}</div>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        {{ $t('open.create.teamTimezone') }}
                    </div>
                    <div class="team_fields_block">
                        <div>UTC{{ teamData.timezoneOffset >= 0 ? "+" : "" }}{{ teamData.timezoneOffset }}:00</div>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        {{ $t('open.teams.headers.teamCaptain') }}
                    </div>
                    <div class="team_fields_block team__member_list">
                        <a
                            class="team__member"
                            :href="'https://osu.ppy.sh/users/' + teamData.captain.osuID"
                        >
                            <img
                                v-if="teamData.captain.isCaptain"
                                class="team__member_captain"
                                src="../../../Assets/img/site/open/team/captain.svg"
                            >
                            <div 
                                v-else 
                                class="team__member_captain"
                            />
                            <img 
                                class="team__member_avatar"
                                :src="`https://a.ppy.sh/${teamData.captain.osuID}`"
                            >
                            <div class="team__member_name">
                                {{ teamData.captain.username }}
                            </div>
                        </a>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        {{ $t('open.teams.headers.teamMembers') }}
                        <div 
                            v-if="isCaptain && teamData.members.filter(m => !m.isCaptain).length > 0 && !teamData.qualifier?.mp"
                            class="team_fields--clickable"
                            @click="editMembers = !editMembers"
                        >
                            {{ !editMembers ? $t('open.teams.headers.editTeamMembers') : $t('open.teams.headers.closeTeamMembers') }}
                        </div>
                        <!-- <div 
                            v-if="isCaptain && !teamData.qualifier?.mp"
                            class="team_fields--clickable"
                            @click="captainToggle"
                        >
                            {{ teamData.members.some(m => m.isCaptain) ? $t('open.teams.headers.becomeCaptain') : $t('open.teams.headers.becomeMember') }}
                        </div> -->
                    </div>
                    <div class="team_fields_block team__member_list">
                        <div
                            v-for="member in teamData.members"
                            :key="member.ID"
                            class="team__member_invite"
                        >
                            <a   
                                :href="'https://osu.ppy.sh/users/' + member.osuID"
                                class="team__member"
                            >
                                <img
                                    v-if="member.isCaptain"
                                    class="team__member_captain"
                                    src="../../../Assets/img/site/open/team/captain.svg"
                                >
                                <div 
                                    v-else 
                                    class="team__member_captain"
                                />
                                <img 
                                    class="team__member_avatar"
                                    :src="`https://a.ppy.sh/${member.osuID}`"
                                >
                                <div class="team__member_name">
                                    {{ member.username }}
                                </div>
                                <div class="team__member_bws">
                                    {{ Math.round(member.BWS) }} BWS
                                </div>
                            </a>
                            <div>
                                <div
                                    v-if="!member.isCaptain && isCaptain && editMembers" 
                                    class="team__member_x"
                                    @click="removeMember(member)"
                                >
                                    X
                                </div>
                                <div
                                    v-if="!member.isCaptain && isCaptain && editMembers" 
                                    class="team__member_crown"
                                    @click="transferCaptain(member)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    v-if="teamData.ID === team?.ID && !teamData.qualifier?.mp"
                    class="team_fields_row"
                >
                    <div class="team_fields_block--label">
                        {{ $t('open.teams.headers.teamInvites') }}

                        <div 
                            v-if="isCaptain"
                            class="team_fields--clickable"
                            @click="editInvites = !editInvites"
                        >
                            {{ !editInvites ? $t('open.teams.headers.editTeamInvites') : $t('open.teams.headers.closeTeamInvites') }}
                        </div>
                    </div>
                    <div class="team_fields_block team__member_list">
                        <div
                            v-for="member in teamData.invites"
                            :key="member.ID"
                            class="team__member_invite"
                        >
                            <a   
                                :href="'https://osu.ppy.sh/users/' + member.osuID"
                                class="team__member"
                            >
                                <div class="team__member_captain" />
                                <img 
                                    class="team__member_avatar"
                                    :src="`https://a.ppy.sh/${member.osuID}`"
                                >
                                <div class="team__member_name">
                                    {{ member.username }}
                                </div>
                            </a>
                            <div
                                v-if="isCaptain && editInvites" 
                                class="team__member_x"
                                @click="removeInvite(member)"
                            >
                                X
                            </div>
                        </div>
                        <div class="team__member_captain" />
                        <div v-if="isCaptain && editInvites">
                            <SearchBar
                                :placeholder="`${$t('open.teams.placeholders.searchUser')}`"
                                style="min-width: 500px;"
                                @update:search="search($event)"
                            />
                            <div 
                                v-for="user in users"
                                :key="user.ID"
                                class="team__member team__member--search"
                                @click="inviteUser(user)"
                            >
                                <div class="team__member_captain" />
                                <img 
                                    class="team__member_avatar"
                                    :src="`https://a.ppy.sh/${user.osu.userID}`"
                                >
                                <div class="team__member_name">
                                    {{ user.osu.username }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="team_fields_row">
                    <div class="team_fields_block--label">
                        {{ $t('open.teams.headers.qualifier') }}
                        <div
                            v-if="isCaptain && teamData.qualifier && !teamData.qualifier.mp"
                            class="team_fields--clickable"
                            @click="unregister"
                        >
                            {{ $t('open.teams.deleteTeam') }}
                        </div>
                        <div 
                            v-if="isCaptain && tournament && tournament.minTeamSize <= teamData.members.length && tournament.maxTeamSize >= teamData.members.length && !teamData.qualifier?.mp"
                            @click="editQualifier = !editQualifier"
                        >
                            <div
                                v-if="teamData.qualifier && !teamData.qualifier.mp" 
                                class="team_fields--clickable"
                            >
                                {{ $t('open.teams.editQualifierTime') }}
                            </div>
                            <div
                                v-else-if="!teamData.qualifier"
                                class="team_fields--clickable"
                            >
                                {{ $t('open.teams.createJoinQualifier') }}
                            </div>
                        </div>
                        <div v-else-if="isCaptain && tournament">
                            <div class="team_fields--clickable">
                                {{ tournament.minTeamSize === tournament.maxTeamSize ? $t('open.teams.headers.requiredMessageExact', {minTeamSize: tournament.minTeamSize}) : $t('open.teams.headers.requiredMessageRange', {minTeamSize: tournament.minTeamSize, maxTeamSize: tournament.maxTeamSize}), }}
                            </div>
                        </div>
                    </div>
                    <NuxtLink 
                        v-if="teamData?.qualifier"
                        class="team_fields_block"
                        style="text-decoration: none;"
                        :to="'/qualifier/' + teamData.qualifier.ID"
                    >
                        <div>{{ $t("open.teams.qualifierId") }} #{{ teamData.qualifier.ID }}</div>
                        <div>{{ teamData.qualifier.date.toLocaleString('en-US', optionsUTC) }} ({{ teamData.qualifier.date.toLocaleString('en-US', options) }})</div>
                    </NuxtLink>
                    <div 
                        v-else
                        class="team_fields_block"
                    >
                        {{ $t('open.teams.notRegistered') }}
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
                        src="../../../Assets/img/site/open/team/default.png"
                    > 
                    <span>{{ $t("open.status.loading") }}...</span>
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
                        src="../../../Assets/img/site/open/team/default.png"
                    > 
                    <span>NO TEAM FOUND</span>
                </div>
            </OpenTitle>
        </div>
        <!-- Team Edit Modal -->
        <BaseModal
            v-if="edit && teamData && teamData.captain.ID === loggedInUser?.ID"
            @close="edit = false"
        >
            <div class="team_fields">
                <div class="team_fields_row">
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
                <div class="team_fields_row">
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
                <div
                    class="team_fields_block--edit"
                    v-html="$t('open.create.timezoneText')" 
                />
                <div class="team_fields_row">
                    <div class="team_fields_block--label team_fields_block--edit">
                        {{ $t('open.teams.edit.timezone') }}
                    </div>
                    <div class="team_fields_block">
                        <OpenSelect
                            class="team__input"
                            :value="timezone"
                            :options="timezones"
                            @change="timezone = $event"
                        />
                    </div>
                </div>
                <div
                    class="team_fields_block--edit"
                    v-html="$t('open.create.avatarInfo1')"
                />
                <div class="team_fields_row">
                    <div class="team_fields_block--label team_fields_block--edit">
                        {{ $t('open.teams.edit.teamAvatar') }}
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

                        <div
                            v-if="image" 
                            class="team_fields_block--edit"
                        >
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
                    {{ $t('open.teams.edit.errors.size') }}
                </div>
                <div 
                    v-if="typeError"
                    class="team_fields_block--edit"
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
            <ContentButton
                v-if="!teamData.qualifier?.mp"
                class="content_button--red content_button--red_sm team_fields_block--edit"
                @click.native="deleteTeam"
            >
                {{ $t('open.teams.edit.deleteTeam') }}
            </ContentButton>
        </BaseModal>
        <!-- Qualifier Edit Modal -->
        <QualifierModal
            v-if="editQualifier && teamData && teamData.captain.ID === loggedInUser?.ID"
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

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenInput from "../../../Assets/components/open/OpenInput.vue";
import OpenSelect from "../../../Assets/components/open/OpenSelect.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../../Assets/components/BaseModal.vue";
import SearchBar from "../../../Assets/components/SearchBar.vue";
import QualifierModal from "../../../Assets/components/open/QualifierModal.vue";
import { getTimezoneOffset } from "../../../Server/utils/dateParse";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        OpenInput,
        OpenSelect,
        OpenTitle,
        BaseModal,
        SearchBar,
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
    @openModule.State team!: TeamInterface | null;

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

    async getTeam (refresh: boolean): Promise<TeamInterface | null> {
        this.loading = true;
        if (!this.$route.params.id || parseInt(this.$route.params.id) === this.team?.ID) {
            if (refresh)
                await this.$store.dispatch("open/setTeam");
            this.loading = false;
            return this.team;
        }

        const { data: teamData } = await this.$axios.get<{ error: string } | TeamInterface>(`/api/team/${this.$route.params.id}`);
        if ("error" in teamData) {
            alert(teamData.error);
            this.loading = false;
            return null;
        }

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
        return this.teamData?.ID === this.team?.ID && this.teamData?.captain.ID === this.loggedInUser?.ID;
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
            await this.$store.dispatch("open/setTeam");
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

    async search (userSearch: string) {
        try {
            const { data } = await this.$axios.get<{ users: User[] }>(`/api/users/search?user=${userSearch}`);

            if (!data.success)
                alert(data.error);
            else
                this.users = data.users;
        } catch (error) {
            alert(this.$t("open.teams.edit.errors.contactVinxis") as string);
            console.error(error);
        }
    }

    async inviteUser (user: User) {
        if (!this.teamData)
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.invite", {username: user.osu.username}) as string))
            return;

        const { data: res } = await this.$axios.post(`/api/team/invite/${this.teamData.ID}`, {
            userID: user.ID,
            idType: "corsace",
        });

        if (res.success)
            this.teamData = await this.getTeam(true);
        else
            alert(res.error);
    }

    async removeInvite (user: TeamUser) {
        if (!this.teamData)
            return;

        if (!confirm(this.$t("open.teams.edit.confirm.removeInvite", {username: user.username}) as string))
            return;

        const { data: res } = await this.$axios.post(`/api/team/invite/${this.teamData.ID}/cancel/${user.ID}`);

        if (res.success)
            this.teamData = await this.getTeam(true);
        else
            alert(res.error);
    }

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

        text-transform: uppercase;

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

        &_captain {
            width: 20px;
            height: 20px;
        }

        &_invite {
            display: flex;
            align-items: flex-start;
        }

        &_x {
            cursor: pointer;
            font-family: $font-ggsans;
            font-weight: 700;
            font-size: $font-lg;
            margin-bottom: 10px;
            color: $gray;

            &:hover {
                color: $open-red;
            }
        }

        &_crown {
            width: 20px;
            height: 20px;
            background-image: url('../../../Assets/img/site/open/team/captain.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            cursor: pointer;
            filter: saturate(0);

            &:hover {
                filter: saturate(1);
            }
        }

        &--search {
            cursor: pointer;
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