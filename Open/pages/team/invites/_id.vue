<template>
    <div
        v-if="teamData" 
        class="invites_team"
    >
        <OpenTitle>
            {{ teamData.name }} {{ $t("open.navbar.invitations") }}
            <template
                #right
            >
                <ContentButton
                    class="content_button--red"
                    :link="`/team/${teamData.ID}`"
                >
                    {{ $t('open.teams.headers.teamPage') }}
                </ContentButton>
            </template>
        </OpenTitle>
        <div class="invites_team__container">
            <div
                v-if="isCaptain" 
                class="invites_team__search"
            >
                <div class="invites_team__search_input">
                    <span class="invites_team--title">PLAYER SEARCH</span>
                    <SearchBar
                        :placeholder="`${$t('open.teams.placeholders.searchUser')}`"
                        @update:search="search($event)"
                    />
                    Users must have a Corsace account.
                </div>
                <span class="invites_team--title">RESULTS</span>
                <div class="invites_team__search_results">
                    <div
                        v-for="user in userSearch"
                        :key="user.ID"
                        class="invites_team__user"
                        :style="{backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(https://a.ppy.sh/${user.osu.userID})`}"
                    >
                        {{ user.osu.username }}
                        <ContentButton
                            @click.native="inviteUser(user)"
                        >
                            {{ $t("open.teams.invites.invite") }}
                        </ContentButton>
                    </div>
                </div>
            </div>
            <div class="invites_team__current_invites">
                <span class="invites_team--title">CURRENT INVITES</span>
                <div class="invites_team__current_list">
                    <div
                        v-for="invite in teamInvites"
                        :key="invite.ID"
                        class="invites_team__user"
                        :style="{backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(https://a.ppy.sh/${invite.osuID})`}"
                    >
                        {{ invite.username }}
                        <ContentButton 
                            v-if="isCaptain"
                            @click.native="removeInvite(invite)"
                        >
                            {{ $t("open.teams.invites.decline") }}
                        </ContentButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import OpenTitle from "../../../../Assets/components/open/OpenTitle.vue";
import ContentButton from "../../../../Assets/components/open/ContentButton.vue";
import SearchBar from "../../../../Assets/components/SearchBar.vue";

import { User, UserInfo } from "../../../../Interfaces/user";
import { Team, TeamUser, TeamInvites } from "../../../../Interfaces/team";

const openModule = namespace("open");

@Component({
    components: {
        OpenTitle,
        ContentButton,
        SearchBar,
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
                {hid: "og:image",property: "og:image", content: require("../../../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament?.description || ""},
                {name: "twitter:image", content: require("../../../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../../../Assets/img/site/open/banner.png")},  
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
    validate ({ params }) {
        return !params.id || !isNaN(parseInt(params.id));
    },
})
export default class Invites extends Vue {
    @State loggedInUser!: null | UserInfo;

    @openModule.State myTeams!: Team[] | null;
    @openModule.State inviteList!: TeamInvites[] | null;
    
    teamData: Team | null = null;
    userSearch: User[] = [];

    get teamInvites () {
        return this.inviteList?.find(invite => invite.teamID === this.teamData?.ID)?.invites ?? [];
    }

    get isCaptain (): boolean {
        return this.teamData?.captain.ID === this.loggedInUser?.ID;
    }

    async mounted () {
        if (!this.myTeams || !this.myTeams.some(team => team.ID === parseInt(this.$route.params.id))) {
            await this.$router.push("/");
            return;
        }

        this.teamData = this.myTeams.find(team => team.ID === parseInt(this.$route.params.id)) ?? null;
    }

    async search (userSearch: string) {
        if (!userSearch)
            return this.userSearch = [];

        try {
            const { data } = await this.$axios.get<{ users: User[] }>(`/api/users/search?user=${userSearch}`);

            if (!data.success)
                alert(data.error);
            else
                this.userSearch = data.users.filter(user => !this.teamInvites.some(invite => invite.ID === user.ID));
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
            await this.$store.dispatch("open/setTeamInvites");
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
            await this.$store.dispatch("open/setTeamInvites");
        else
            alert(res.error);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.invites_team {
    align-self: center;
    display: flex;
    flex-direction: column;
    position: relative;
    width: 75vw;
    padding: 0 43px;
    padding-top: 50px;
    overflow: hidden;

    &__container {
        display: flex;
        flex-wrap: wrap;
        gap: 25px;
    }

    &__search {
        display: flex;
        flex-direction: column;
        gap: 25px;
        width: 25%;
        height: 60%;
        overflow: hidden;

        &_results {
            display: flex;
            flex-direction: column;
            gap: 25px;
            overflow: auto;
            scrollbar-color: #545454 #131313;
            scrollbar-width: thin;
        }
    }

    &__user {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        padding: 10px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        color: white;
        font-weight: bold;
    }

    &__current {
        &_invites {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }

        &_list {
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            height: 25%;
            gap: 25px;
        }
    }

    &--title {
        font-size: $font-lg;
        font-weight: bold;
        font-stretch: condensed;
        color: $open-red;
    }
}
</style>