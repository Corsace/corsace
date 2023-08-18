<template>
    <div 
        class="referee"
        @mousemove="updateTooltipPosition($event)"
    >
        <div
            ref="tooltip" 
            class="referee__tooltip"
            :style="{ display: tooltipText ? 'block' : 'none' }"
        >
            {{ tooltipText }}
        </div>
        <div class="referee__container">
            <OpenTitle>
                {{ $t('open.referee.title') }} {{ matchup ? `- (${matchup.ID}) ${matchup.team1?.name || "TBD"} vs ${matchup.team2?.name || "TBD"}` : "" }}
            </OpenTitle>
            <!-- Matchup Selected -->
            <div 
                v-if="matchup"
                class="referee__matchup"
            >
                <div class="referee__matchup__header">
                    <div class="referee__matchup__header__date">
                        {{ formatDate(matchup.date) }} {{ formatTime(matchup.date) }}
                    </div>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': matchup.mp,
                        }"
                        @click.native="!matchup.mp ? banchoCall('createLobby', { auto: false }) : tooltipText = 'Matchup already has a lobby'"
                    >
                        {{ $t('open.referee.createLobby') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || matchup.first || matchup.stage?.stageType === 0,
                        }"
                        @click.native="matchup.mp && !matchup.first && matchup.stage?.stageType !== 0 ? banchoCall('roll') : tooltipText = matchup.first ? 'Matchup already rolled' : 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.roll') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp,
                        }"
                        @click.native="matchup.mp ? banchoCall('settings') : 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.settings') }}
                    </ContentButton>
                </div>
                
                <div 
                    v-if="matchup.mp"
                    class="referee__matchup__messages"
                >
                    <div class="referee__matchup__messages__header">
                        Channel: #mp_{{ matchup.mp }}
                    </div>
                    <div 
                        id="messageContainer"
                        class="referee__matchup__messages__container"
                    >
                        <div
                            v-for="message in filteredMessages"
                            :key="message.ID"
                            class="referee__matchup__messages__message"
                        >
                            <div class="referee__matchup__messages__message__timestamp">
                                {{ formatTime(message.timestamp) }}
                            </div>
                            <div class="referee__matchup__messages__message__user">
                                {{ message.user.osu.username }}:
                            </div>
                            <div class="referee__matchup__messages__message__content">
                                {{ message.content }}
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="loggedInUser"
                        class="referee__matchup__messages__input_div"
                    >
                        {{ loggedInUser.osu.username }}:
                        <input
                            v-model="inputMessage"
                            class="referee__matchup__messages__input"
                            placeholder="Type a message..."
                            @keyup.enter="sendMessage"
                        >
                    </div>
                    <div class="referee__matchup__messages__checkboxes">
                        <div class="referee__matchup__messages__checkboxes_div">
                            Show Bancho Messages
                            <input 
                                v-model="showBanchoMessages"
                                class="referee__matchup__messages__checkboxes__checkbox"
                                type="checkbox"
                            >
                        </div>
                        <div class="referee__matchup__messages__checkboxes_div">
                            Show Bancho Settings
                            <input 
                                v-model="showBanchoSettings"
                                class="referee__matchup__messages__checkboxes__checkbox"
                                type="checkbox"
                            >
                        </div>
                        <div class="referee__matchup__messages__checkboxes_div">
                            Show Corsace Messages
                            <input 
                                v-model="showCorsaceMessages"
                                class="referee__matchup__messages__checkboxes__checkbox"
                                type="checkbox"
                            >
                        </div>
                    </div>
                </div>
                <div class="referee__matchup__content">
                    <div class="referee__matchup__content_div">
                        <div class="referee__matchup__content__staff">
                            <div class="referee__matchup__content__team__name">
                                Staff
                            </div>
                            <div class="referee__matchup__content__team__members">
                                <div 
                                    v-if="matchup.referee"
                                    class="referee__matchup__content__team__members__member"
                                    @click="matchup.mp ? banchoCall('addRef', { userID: matchup.referee.osu.userID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${matchup.referee.osu.userID})` }"
                                    />
                                    {{ matchup.referee.osu.username }} ({{ matchup.referee.osu.userID }})
                                </div>
                                <div 
                                    v-if="matchup.streamer"
                                    class="referee__matchup__content__team__members__member"
                                    @click="matchup.mp ? banchoCall('addRef', { userID: matchup.streamer.osu.userID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${matchup.streamer.osu.userID})` }"
                                    />
                                    {{ matchup.streamer.osu.username }} ({{ matchup.streamer.osu.userID }})
                                </div>
                                <div 
                                    v-for="member in matchup.commentators"
                                    :key="member.ID"
                                    class="referee__matchup__content__team__members__member"
                                    @click="matchup.mp ? banchoCall('addRef', { userID: member.osu.userID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${member.osu.userID})` }"
                                    />
                                    {{ member.osu.username }} ({{ member.osu.userID }})
                                </div>
                            </div>
                        </div>
                        <div class="referee__matchup__content__team">
                            <div class="referee__matchup__content__team__name">
                                {{ matchup.team1?.name || "TBD" }}
                            </div>
                            <div class="referee__matchup__content__team__avatar_section">
                                <div 
                                    class="referee__matchup__content__team__avatar"
                                    :style="{ backgroundImage: `url(${matchup.team1?.avatarURL || require('../../Assets/img/site/open/team/default.png')})` }"
                                />
                                <div class="referee__matchup__content__team__stats">
                                    {{ team1PlayerStates.filter(player => player.inLobby).length }} in lobby
                                </div>
                                <div class="referee__matchup__content__team__stats">
                                    {{ team1PlayerStates.filter(player => player.ready).length }} ready
                                </div>
                            </div>
                            <div class="referee__matchup__content__team__members">
                                <div 
                                    v-for="member in team1PlayerStates"
                                    :key="member.ID"
                                    class="referee__matchup__content__team__members__member"
                                    :class="{
                                        'referee__matchup__content__team__members__member--ready': member.ready,
                                        'referee__matchup__content__team__members__member--notInLobby': !member.inLobby,
                                    }"
                                    @click="matchup.mp ? banchoCall('invite', { userID: member.osuID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :class="{
                                            'referee__matchup__content__team__members__member__avatar--ready': member.ready,
                                        }"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${member.osuID})` }"
                                    />
                                    {{ member.username }} ({{ member.osuID }}) {{ member.team ?? '' }} {{ member.mods ? `+${member.mods.toUpperCase()}` : "" }}
                                </div>
                            </div>
                        </div>
                        <div class="referee__matchup__content__team">
                            <div class="referee__matchup__content__team__name">
                                {{ matchup.team2?.name || "TBD" }}
                            </div>
                            <div class="referee__matchup__content__team__avatar_section">
                                <div 
                                    class="referee__matchup__content__team__avatar"
                                    :style="{ backgroundImage: `url(${matchup.team2?.avatarURL || require('../../Assets/img/site/open/team/default.png')})` }"
                                />
                                <div class="referee__matchup__content__team__stats">
                                    {{ team2PlayerStates.filter(player => player.inLobby).length }} in lobby
                                </div>
                                <div class="referee__matchup__content__team__stats">
                                    {{ team2PlayerStates.filter(player => player.ready).length }} ready
                                </div>
                            </div>
                            <div class="referee__matchup__content__team__members">
                                <div 
                                    v-for="member in team2PlayerStates"
                                    :key="member.ID"
                                    class="referee__matchup__content__team__members__member"
                                    :class="{
                                        'referee__matchup__content__team__members__member--ready': member.ready,
                                        'referee__matchup__content__team__members__member--notInLobby': !member.inLobby,
                                    }"
                                    @click="matchup.mp ? banchoCall('invite', { userID: member.osuID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${member.osuID})` }"
                                        :class="{
                                            'referee__matchup__content__team__members__member__avatar--ready': member.ready,
                                        }"
                                    />
                                    {{ member.username }} ({{ member.osuID }}) {{ member.team ?? '' }} {{ member.mods ? `+${member.mods.toUpperCase()}` : "" }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="referee__matchup__content_div" />
                </div>
                <div class="referee__matchup__footer">
                    <ContentButton
                        class="referee__matchup__footer__button content_button--red"
                        @click.native="back"
                    >
                        {{ $t('open.referee.back') }}
                    </ContentButton>
                </div>
            </div>
            <!-- Matchup list -->
            <div 
                v-else-if="matchupList"
                class="referee__matchups"
            >
                <div 
                    v-for="matchup in matchupList"
                    :key="matchup.ID"
                    class="referee__matchups__matchup"
                    @click="selectMatchup(matchup.ID)"
                >
                    <div class="referee__matchups__matchup_name">
                        ({{ matchup.ID }}) {{ matchup.teams?.map(team => team.name).join(" vs ") ?? (matchup.team1 || matchup.team2) ? `${matchup.team1?.name || "TBD"} vs ${matchup.team2?.name || "TBD"}` : "TBD" }}
                    </div>
                    <div class="referee__matchups__matchup_date">
                        {{ formatDate(matchup.date) }} {{ formatTime(matchup.date) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import { Centrifuge, PublicationContext, Subscription } from "centrifuge";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import { Tournament } from "../../Interfaces/tournament";
import { Matchup } from "../../Interfaces/matchup";
import { UserInfo } from "../../Interfaces/user";

const openModule = namespace("open");

interface playerState {
    ID: number;
    username: string;
    osuID: string;
    inLobby: boolean;
    ready: boolean;
    mods: string;
    team?: "Blue" | "Red";
}

interface message {
    ID: number;
    timestamp: Date;
    content: string;
    user: {
        ID: number;
        osu: {
            userID: string;
            username: string;
        }
    }
}

@Component({
    components: {
        OpenTitle,
        ContentButton,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state["open"].tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state["open"].title},
                {name: "twitter:description", content: this.$store.state["open"].tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Referee extends Vue {

    @State loggedInUser!: UserInfo | null;
    @openModule.State tournament!: Tournament | null;

    centrifuge: Centrifuge | null = null;
    matchupChannel: Subscription | null = null;

    matchup: Matchup | null = null;
    matchupList: Matchup[] | null = null;
    mapStarted = false;

    team1PlayerStates: playerState[] = [];
    team2PlayerStates: playerState[] = [];

    inputMessage = "";
    messages: message[] = [];
    showBanchoMessages = true;
    showBanchoSettings = false;
    showCorsaceMessages = true;

    get filteredMessages (): message[] {
        return this.messages.filter(message => {
            if (!message.user?.osu || message.user.osu.userID === "3")
                message.user = {
                    ID: message.user?.ID || 0,
                    osu: {
                        userID: "3",
                        username: "Bancho",
                    },
                };

            if (!this.showBanchoMessages && message.user.osu.userID === "3")
                return false;
            if (
                !this.showBanchoSettings && (
                    message.user.osu.userID === "3" && (
                        message.content.startsWith("Room name:") ||
                        message.content.startsWith("Team mode:") ||
                        message.content.startsWith("Players:") ||
                        message.content.startsWith("Beatmap:") ||
                        message.content.startsWith("Active mods:") ||
                        message.content.startsWith("Slot")
                    )
                ) || message.content.startsWith("!mp settings")
            )
                return false;
            if (!this.showCorsaceMessages && message.user.osu.userID === "29191632")
                return false;
            return true;
        });
    }

    async sendMessage () {
        if (this.inputMessage === "" || !this.matchup || this.inputMessage.length === 0)
            return;

        if (this.inputMessage.length > 200) {
            alert("Message too long");
            return;
        }

        await this.banchoCall("message", { message: this.inputMessage, username: this.loggedInUser?.osu.username });
        this.inputMessage = "";
        const messageContainer = document.getElementById("messageContainer");
        messageContainer?.scrollTo({
            top: messageContainer?.scrollHeight,
            behavior: "smooth",
        });
    }

    tooltipText = "";
    timeoutRef: any = null;
    @Watch("tooltipText")
    clearTooltipText (newValue: string) {
        if (this.timeoutRef) {
            clearTimeout(this.timeoutRef);
        }

        if (newValue) {
            this.timeoutRef = setTimeout(() => {
                this.tooltipText = "";
                this.timeoutRef = null;
            }, 5000);
        }
    }

    updateTooltipPosition (event) {
        const x = event.clientX;
        const y = event.clientY;

        if (this.$refs.tooltip instanceof HTMLElement) {
            this.$refs.tooltip.style.left = `${x + 10}px`;
            this.$refs.tooltip.style.top = `${y + 10}px`;
        }
    }

    async mounted () {
        const { data: matchupData } = await this.$axios.get(`/api/referee/matchups/${this.tournament?.ID}`);
        if (matchupData.error) {
            alert(matchupData.error);
            this.$router.push("/");
            return;
        }
        this.matchupList = matchupData.matchups?.map(matchup => ({
            ...matchup,
            date: new Date(matchup.date),
        })) || [];

        const { data: centrifugoURL } = await this.$axios.get("/api/centrifugo/url");

        const centrifuge = new Centrifuge(centrifugoURL, {

        });

        centrifuge.on("connecting", (ctx) => {
            console.log("connecting", ctx);
        });

        centrifuge.on("error", (err) => {
            console.error("error", err);
        });

        centrifuge.on("connected", (ctx) => {
            console.log("connected", ctx);
        });

        centrifuge.connect();

        this.centrifuge = centrifuge;

        // TODO: Remove after testing
        this.team1PlayerStates = this.matchup?.team1?.members.map(member => ({
            ID: member.ID,
            username: member.username,
            osuID: member.osuID,
            inLobby: false,
            ready: false,
            mods: "",
        })) || [];
        this.team2PlayerStates = this.matchup?.team2?.members.map(member => ({
            ID: member.ID,
            username: member.username,
            osuID: member.osuID,
            inLobby: false,
            ready: false,
            mods: "",
        })) || [];
    }

    formatDate (date: Date): string {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = date.getUTCDate();
        const monthIndex = date.getUTCMonth();
        return `${months[monthIndex]} ${day < 10 ? "0" : ""}${day}`;
    }

    formatTime (date: Date): string {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    }

    unsub () {
        if (this.matchupChannel) {
            this.matchupChannel.unsubscribe();
            this.centrifuge?.removeSubscription(this.matchupChannel);
            this.matchupChannel = null;
        }
    }

    async selectMatchup (matchupID: number) {
        if (!this.centrifuge) {
            alert("Centrifuge not connected");
            return;
        }
        this.unsub();

        const { data: matchupData } = await this.$axios.get(`/api/referee/matchups/${this.tournament?.ID}/${matchupID}`);
        if (matchupData.error) {
            alert(matchupData.error);
            return;
        }

        this.matchup = matchupData.matchup ? {
            ...matchupData.matchup,
            date: new Date(matchupData.matchup.date),
        } : null;

        this.team1PlayerStates = this.matchup?.team1?.members.map(member => ({
            ID: member.ID,
            username: member.username,
            osuID: member.osuID,
            inLobby: false,
            ready: false,
            mods: "",
        })) || [];
        this.team2PlayerStates = this.matchup?.team2?.members.map(member => ({
            ID: member.ID,
            username: member.username,
            osuID: member.osuID,
            inLobby: false,
            ready: false,
            mods: "",
        })) || [];
        this.messages = this.matchup?.messages?.map((message, i) => ({
            ...message,
            ID: i,
            timestamp: new Date(message.timestamp),
        })) || [];

        this.matchupChannel = this.centrifuge.newSubscription(`matchup:${matchupID}`);

        this.matchupChannel.on("error", (err) => {
            alert("Error in console for matchup channel subscription");
            console.error("error", err);
        });

        this.matchupChannel.on("unsubscribed", (ctx) => {
            if (ctx.code > 100) {
                alert("Error in console for matchup channel subscription");
                console.error("unsubscribed", ctx);
            } else
                console.log("unsubscribed", ctx);
        });

        this.matchupChannel.on("subscribed", (ctx) => {
            console.log("subscribed", ctx);
        });

        this.matchupChannel.on("publication", this.handleData);

        this.matchupChannel.subscribe();

        if (this.matchup?.mp)
            await this.banchoCall("settings");
    }

    back () {
        this.unsub();
        this.matchup = null;
        this.messages = [];
    }

    addMessage (data: any) {
        data.type = undefined;
        data.timestamp = new Date(data.timestamp);
        data.ID = this.messages.length;
        const messageContainer = document.getElementById("messageContainer");
        if (!messageContainer) {
            this.messages.push(data);
            return;
        }

        const scrollPos = messageContainer.scrollTop + messageContainer.clientHeight;
        const initialHeight = messageContainer.scrollHeight;
        this.messages.push(data);
        if (scrollPos === initialHeight) {
            setTimeout(() => { 
                const messageContainerNew = document.getElementById("messageContainer")!;
                messageContainerNew.scrollTo({
                    top: messageContainerNew.scrollHeight,
                    behavior: "smooth",
                });
            }, 100);
        }
    }

    handleData (ctx: PublicationContext) {
        console.log("publication", ctx);

        if (!ctx.channel.startsWith("matchup:"))
            return;
        const matchupID = parseInt(ctx.channel.split(":")[1]);
        if (matchupID !== this.matchup?.ID)
            return;

        switch (ctx.data.type) {
            case "created":
                this.matchup.baseURL = ctx.data.baseURL;
                this.matchup.mp = ctx.data.mpID;
                break;
            case "message":
                this.addMessage(ctx.data);
                break;
            case "first":
                this.matchup.first = this.matchup.team1?.ID === ctx.data.first ? this.matchup.team1 : this.matchup.team2;
                break;
            case "settings":
                this.team1PlayerStates = this.team1PlayerStates.map(player => {
                    const slotPlayer = ctx.data.slots.find(slot => slot.playerOsuID === parseInt(player.osuID));
                    return {
                        ...player,
                        inLobby: slotPlayer !== undefined,
                        ready: slotPlayer?.ready || false,
                        team: slotPlayer?.team,
                        mods: slotPlayer?.mods || "",
                    };
                });
                this.team2PlayerStates = this.team2PlayerStates.map(player => {
                    const slotPlayer = ctx.data.slots.find(slot => slot.playerOsuID === parseInt(player.osuID));
                    return {
                        ...player,
                        inLobby: slotPlayer !== undefined,
                        ready: slotPlayer?.ready || false,
                        team: slotPlayer?.team,
                        mods: slotPlayer?.mods || "",
                    };
                });
                break;
            case "matchStarted":
                break;
            case "matchAborted":
                break;
            case "matchFinished":
                break;
        }
    }

    async banchoCall (endpoint: string, data?: any) {
        if (!this.matchup) {
            this.tooltipText = "No matchup selected";
            return;
        }

        if (
            (
                endpoint === "createLobby" || 
                endpoint === "roll"
            ) &&
            !confirm(`Are you sure you want to ${endpoint}?`)
        )
            return;

        const { data: lobbyData } = await this.$axios.post(`/api/referee/bancho/${this.tournament?.ID}/${this.matchup.ID}`, {
            endpoint,
            ...data,
        });

        if (lobbyData.error) {
            if (endpoint !== "settings")
                alert(lobbyData.error);
            console.error(lobbyData.error, Object.keys(lobbyData.error));
            return;
        }

        switch (endpoint) {
            case "createLobby":
                this.tooltipText = "Lobby created";
                break;
            case "addRef":
                this.tooltipText = "Addreffed";
                break;
            case "invite":
                this.tooltipText = "Invited";
                break;
            case "roll":
                this.tooltipText = "Rolled";
                break;
            case "settings":
                this.tooltipText = "Settings ran";
                break;
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.referee {
    width: 100%;

    &__tooltip {
        position: fixed;
        transition: none;
        z-index: 10;

        background-color: #1B1B1B;
        padding: 10px;
        border-radius: 10px;

    }

    &__container {
        width: 95vw;
        align-self: center;
        position: relative;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }

    &__matchup {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 20px;
        padding: 20px;

        &__header {
            display: flex;
            align-items: center;
            gap: 5px;
            grid-column: 1 / 3;

            &__title {
                font-size: $font-lg;
                font-weight: 500;
            }

            &__date {
                font-size: $font-base;
                font-weight: 300;
            }

            &__create_lobby__button {
                white-space: nowrap;
            }
        }

        &__messages {
            display: flex;
            flex-direction: column;
            gap: 5px;
            background-color: #181818;
            padding: 10px;
            
            grid-column: 3 / 4;
            grid-row: 1 / 4;

            &__header {
                font-size: $font-lg;
                font-weight: bold;
            }

            &__container {
                overflow-y: scroll;
                max-height: 550px;

                &::-webkit-scrollbar {
                    width: 5px;
                }

                &::-webkit-scrollbar-track {
                    background: #333333;
                }

                &::-webkit-scrollbar-thumb {
                    background: #555555;
                }

                &::-webkit-scrollbar-thumb:hover {
                    background: #777777;
                }

                &::-webkit-scrollbar-thumb:active {
                    background: #999999;
                }

                scrollbar-color: #555555 #333333;
                scrollbar-width: thin;
            } 

            &__message {
                display: flex;
                gap: 5px;

                &__timestamp {
                    font-size: $font-sm;
                    flex: 1;
                }
                &__user {
                    font-weight: bold;
                    white-space: nowrap;
                    flex: 2;
                }
                &__content {
                    flex: 12;
                }
            }

            &__input {

                &_div {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                background-color: #181818;
                flex: 1;
                border: none;
                border-radius: 5px;
                padding: 5px;
                color: white;
                font-family: $font-ggsans;
                font-size: $font-base;
                outline: none;
            }

            &__checkboxes {
                display: flex;
                flex-wrap: wrap;
                font-size: $font-sm;

                &_div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex: 1;
                    gap: 10px;
                }

                &__checkbox {
                    cursor: pointer;
                    appearance: initial;
                    border: 1px solid #696969;
                    background: #181818;
                    margin: 0;
                    position: relative;
                    height: 20px;
                    width: 20px;

                    &:checked {
                        opacity: 1;
                        background: $open-red;

                        &:after {
                            content: "\d7";
                            color: $open-dark;
                            position: absolute;
                            top: 0;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            font-size: 20px;
                            line-height: 20px;
                            text-align: center;
                        }
                    }
                }
            }
        }

        &__content {
            display: flex;
            gap: 20px;

            grid-column: 1 / 3;

            &_div {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            &__team {
                display: flex;
                flex-direction: column;
                gap: 5px;

                &__name {
                    font-size: $font-lg;
                    font-weight: bold;
                }

                &__avatar {
                    width: 150px;
                    height: 50px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;

                    &_section {
                        display: flex;
                        gap: 5px;
                    }
                }

                &__stats {
                    font-size: $font-xxl;
                    font-weight: bold;
                }

                &__members {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;

                    &__member {
                        display: flex;
                        gap: 5px;
                        cursor: pointer;

                        &--disabled {
                            cursor: not-allowed;
                        }

                        &--ready {
                            color: rgb(158, 216, 84);
                        }

                        &--notInLobby {
                            filter: saturate(0);
                            color: #333333;
                        }

                        &__avatar {
                            width: 20px;
                            height: 20px;
                            background-size: contain;
                            background-repeat: no-repeat;
                            background-position: center;
                            border-radius: 50%;

                            &--ready {
                                border: 2px solid rgb(158, 216, 84);
                            }
                        }
                    }
                }
            }
        }

        &__footer {
            display: flex;
            flex-direction: row;
            gap: 20px;

            grid-column: 1 / 4;

            &__button {
                max-width: 300px;
            }
        }
    }

    &__matchups {
        display: flex;
        flex-direction: column;
        gap: 20px;

        &__matchup {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
            border-radius: 5px;
            background: #333333;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background: #444444;
            }

            &__name {
                font-size: $font-lg;
                font-weight: 500;
            }

            &__date {
                font-size: $font-base;
                font-weight: 300;
            }
        }
    }
}

</style>