<template>
    <div class="invites">
        <OpenTitle>
            {{ $t("open.navbar.invitations") }}
            <template
                #right
            >
            </template>
        </OpenTitle>

        <div class="invites__team_list">
            <div
                v-for="team in teamInvites"
                :key="team.ID"
                class="invites__team_card"
                :style="{backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${team.avatarURL || require('../../../../Assets/img/site/open/team/default.png')})`}"
            >
                {{ team.name }}
                <div
                    class="invites__team_card_buttons"
                >
                    <ContentButton
                        @click.native="inviteAction(team.ID, 'accept')"
                    >
                        {{ $t("open.teams.invites.accept") }}
                    </ContentButton>
                    <ContentButton
                        @click.native="inviteAction(team.ID, 'decline')"
                    >
                        {{ $t("open.teams.invites.decline") }}
                    </ContentButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { UserInfo } from "../../../../Interfaces/user";
import { BaseTeam } from "../../../../Interfaces/team";

import OpenTitle from "../../../../Assets/components/open/OpenTitle.vue";
import ContentButton from "../../../../Assets/components/open/ContentButton.vue";
import SearchBar from "../../../../Assets/components/SearchBar.vue";

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
})
export default class Invites extends Vue {
    @State loggedInUser!: null | UserInfo;

    @openModule.State teamInvites!: BaseTeam[] | null;

    async inviteAction (inviteID: number, action: "accept" | "decline") {
        try {
            const { data } = await this.$axios.post(`/api/team/invite/${inviteID}/${action}`);
            if (!data.success)
                return alert(data.error);
            await this.$store.dispatch("open/setMyTeams");
            await this.$store.dispatch("open/setInvites");
        } catch (e) {
            alert("Something went wrong. Contact VINXIS. Error is in console, which can be accessed by pressing F12.");
            console.log(e);
        }
    }
}
</script>

<style lang="scss">
.invites {
    align-self: center;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    position: relative;
    width: 75vw;
    padding: 0 43px;
    gap: 25px;
    padding-top: 50px;

    &__team {
        &_list {
            display: flex;
            flex-wrap: wrap;
            gap: 25px;
        }
        &_card {
            background-repeat: no-repeat;
            background-size: contain;
            font-weight: bold;
            width: 300px;
            height: 100px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            &_buttons {
                font-weight: normal;

                display: flex;
                align-items: center;
                gap: 10px;
            }
        } 
    }
}
</style>