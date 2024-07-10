<template>
    <div class="teams_list">
        <SubHeader
            :selections="[
                { text: $t('open.teams.teamList'), value: 'list' },
                { text: $t('open.teams.teamManagement'), value: 'management' },
            ]"
            :current-page="page"
            @update:page="page = $event"
        />
        <div 
            v-if="filteredTeams && page === 'list'"
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.teams.teamList') }}
                <template #right>
                    <SearchBar
                        :placeholder="`${$t('open.teams.searchPlaceholder')}`"
                        style="margin-bottom: 10px;"
                        @update:search="searchValue = $event"
                    />
                </template>
            </OpenTitle>
            <div
                v-if="filteredTeams.length !== 0" 
                class="teams_list__main_content_list"
            >
                <OpenCardTeam
                    v-for="team in filteredTeams"
                    :key="team.ID"
                    :team="team"
                />
            </div>
            <div
                v-else
                class="teams_list__main_content"
            >
                No registered teams currently
            </div>
        </div>
        <div 
            v-else-if="page === 'management' && loggedInUser?.discord.userID"
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.teams.teamManagement') }}
                <template #right>
                    <ContentButton
                        class="content_button--red"
                        :link="'team/create'"
                    >
                        {{ $t('open.create.title') }}
                    </ContentButton>
                </template>
            </OpenTitle>
            <div 
                v-if="filteredTeams && filteredTeams.length !== 0"
                class="teams_list__main_content_list"
            >
                <OpenCardTeam
                    v-for="team in filteredTeams"
                    :key="team.ID"
                    :team="team"
                />
            </div>
            <div
                v-else
                class="teams_list__main_content"
            >
                You are currently not in any teams
            </div>
        </div>
        <div
            v-else-if="page === 'management'"
            class="teams_list__main_content"
        >
            {{ $t('open.teams.loginManagement') }}
        </div>
        <div
            v-else-if="loading"
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.status.loading') }}...
            </OpenTitle>
        </div>
        <div
            v-else 
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.teams.error') }}...
            </OpenTitle>
        </div>
    </div>
</template>

<script lang="ts">
import { Mixins, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import { ExtendedPublicationContext } from "centrifuge";
import CentrifugeMixin from "../../Assets/mixins/centrifuge";

import { Tournament } from "../../Interfaces/tournament";
import { Team, TeamList } from "../../Interfaces/team";
import { UserInfo } from "../../Interfaces/user";

import SearchBar from "../../Assets/components/SearchBar.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import OpenCardTeam from "../../Assets/components/open/OpenCardTeam.vue";
import SubHeader from "../../Assets/components/open/SubHeader.vue";

const openModule = namespace("open");

@Component({
    components: {
        SearchBar,
        OpenTitle,
        ContentButton,
        OpenCardTeam,
        SubHeader,
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
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament?.description || ""},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Teams extends Mixins(CentrifugeMixin) {

    @State loggedInUser!: null | UserInfo;
    @openModule.State tournament!: Tournament | null;
    @openModule.State myTeams!: Team[] | null;
    @openModule.State teamList!: TeamList[] | null;

    loading = true;
    searchValue = "";
    page: "list" | "management" = "list";

    get filteredTeams () {
        if (this.page === "management")
            return this.myTeams;
        if (!this.searchValue)
            return this.teamList;
        return this.teamList?.filter(team => 
            team.name.toLowerCase().includes(this.searchValue.toLowerCase()) ||
            team.members.some(member => member.username.toLowerCase().includes(this.searchValue.toLowerCase())) ||
            team.ID.toString().includes(this.searchValue.toLowerCase()) ||
            team.members.some(member => member.ID.toString().includes(this.searchValue.toLowerCase())) ||
            team.members.some(member => member.osuID.toLowerCase().includes(this.searchValue.toLowerCase()))
        );
    }

    async mounted () {
        if (this.$route.query.s === "my")
            this.page = "management";
        this.loading = true;
        if (this.tournament)
            await this.$store.dispatch("open/setTeamList", this.tournament.ID);
        this.loading = false;

        if (this.tournament)
            await this.initCentrifuge(`teams:${this.tournament.ID}`);
    }

    handleData (ctx: ExtendedPublicationContext) {
        if (ctx.data.type === "teamRegistered")
            this.$store.commit("open/addTeamList", ctx.data.team);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.teams_list {

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;

        &_list {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: flex-start;
            margin-top: 25px;
        }
    }
}
</style>