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
        <div
            ref="mapStatusSelect"
            class="referee__menu_select"
            :style="{ display: mapSelected ? 'flex' : 'none' }"
        >
            <div 
                class="referee__menu_select__option referee__menu_select__option--blue"
                @click="banchoCall('selectMap', { mapID: mapSelected?.ID, status: 0, set: (matchupSet?.order || 1) - 1 }); mapSelected = null"
            >
                PROTECT
            </div>
            <div 
                class="referee__menu_select__option referee__menu_select__option--red"
                @click="banchoCall('selectMap', { mapID: mapSelected?.ID, status: 1, set: (matchupSet?.order || 1) - 1 }); mapSelected = null"
            >
                BAN
            </div>
            <div 
                class="referee__menu_select__option referee__menu_select__option--green"
                @click="banchoCall('selectMap', { mapID: mapSelected?.ID, status: 2, set: (matchupSet?.order || 1) - 1 }); mapSelected = null"
            >
                PICK
            </div>
        </div>
        <div
            ref="rollSelect"
            class="referee__menu_select"
            :style="{ display: rollMenu ? 'flex' : 'none' }"
        >
            <div 
                class="referee__menu_select__option referee__menu_select__option--blue"
                @click="banchoCall('roll', { allowed: 'managers' }); rollMenu = false"
            >
                ONLY MANAGERS ROLL
            </div>
            <div 
                class="referee__menu_select__option referee__menu_select__option--blue"
                @click="banchoCall('roll', { allowed: 'all' }); rollMenu = false"
            >
                ANY TEAM MEMBER ROLLS
            </div>
            <div 
                class="referee__menu_select__option referee__menu_select__option--blue"
                @click="banchoCall('roll', { allowed: 'bot' }); rollMenu = false"
            >
                BOT AUTO-ROLLS
            </div>
        </div>
        <div class="referee__container">
            <OpenTitle>
                {{ $t('open.referee.title') }} {{ matchup ? `- (${matchup.ID}) ${matchup.team1?.name || "TBD"} vs ${matchup.team2?.name || "TBD"}` : "" }}
            </OpenTitle>
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
                            'content_button--disabled': matchup.mp && runningLobby,
                        }"
                        @click.native="!matchup.mp || !runningLobby ? banchoCall('createLobby', { auto: false }) : tooltipText = 'Matchup already has a lobby'"
                    >
                        {{ $t('open.referee.createLobby') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || matchup.stage?.stageType === 0 || !runningLobby,
                        }"
                        @click.native="matchup.mp && runningLobby && matchup.stage?.stageType !== 0 ? toggleRollMenu() : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ matchupSet?.first ? $t('open.referee.reroll') : $t('open.referee.roll') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby,
                        }"
                        @click.native="matchup.mp && runningLobby ? banchoCall('settings') : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.settings') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                        }"
                        style="font-size: 12px;"
                        @click.native="matchup.mp && runningLobby && !mapStarted ? banchoCall('timer', { time: parseInt(mapTimer) }) : mapStarted ? tooltipText = 'Matchup is currently playing a map' : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.timer') }} <input
                            v-model="mapTimer"
                            class="referee__matchup__messages__input"
                            style="width: 40px;"
                        >
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                        }"
                        style="font-size: 12px;"
                        @click.native="matchup.mp && runningLobby && !mapStarted ? banchoCall('timer', { time: parseInt(readyTimer) }) : mapStarted ? tooltipText = 'Matchup is currently playing a map' : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.timer') }} <input
                            v-model="readyTimer"
                            class="referee__matchup__messages__input"
                            style="width: 40px;"
                        >
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                        }"
                        @click.native="matchup.mp && runningLobby && !mapStarted ? banchoCall('startMap') : mapStarted ? tooltipText = 'Matchup is currently playing a map' : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.startMap') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || !mapStarted,
                        }"
                        @click.native="matchup.mp && runningLobby && mapStarted ? banchoCall('abortMap') : !mapStarted ? tooltipText = 'Matchup is not currently playing a map' : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.abortMap') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby,
                        }"
                        @click.native="matchup.mp && runningLobby ? banchoCall('closeLobby') : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.closeLobby') }}
                    </ContentButton>
                </div>
                
                <div 
                    v-if="matchup.mp"
                    class="referee__matchup__messages"
                >
                    <div class="referee__matchup__messages_wrapper">
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
                            v-if="loggedInUser && runningLobby"
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
                                    @click="matchup.mp && runningLobby ? banchoCall('addRef', { userID: matchup.referee.osu.userID }) : tooltipText = 'Matchup has no lobby'"
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
                                    @click="matchup.mp && runningLobby ? banchoCall('addRef', { userID: matchup.streamer.osu.userID }) : tooltipText = 'Matchup has no lobby'"
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
                                    @click="matchup.mp && runningLobby ? banchoCall('addRef', { userID: member.osu.userID }) : tooltipText = 'Matchup has no lobby'"
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
                                {{ getTeamName(matchup.team1) }} {{ getRollStatus(matchup.sets, matchup.team1) }}
                            </div>
                            <div class="referee__matchup__content__team__avatar_section">
                                <div 
                                    class="referee__matchup__content__team__avatar"
                                    :style="{ backgroundImage: `url(${matchup.team1?.avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }"
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
                                    @click="matchup.mp && runningLobby ? banchoCall('invite', { userID: member.osuID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :class="{
                                            'referee__matchup__content__team__members__member__avatar--ready': member.ready,
                                        }"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${member.osuID})` }"
                                    />
                                    {{ member.username }} ({{ member.osuID }}) {{ member.slot ? `Slot ${member.slot}` : '' }} {{ member.team ?? '' }} {{ member.mods ? `+${member.mods.toUpperCase()}` : "" }}
                                </div>
                            </div>
                        </div>
                        <div class="referee__matchup__content__team">
                            <div class="referee__matchup__content__team__name">
                                {{ getTeamName(matchup.team2) }} {{ getRollStatus(matchup.sets, matchup.team2) }}
                            </div>
                            <div class="referee__matchup__content__team__avatar_section">
                                <div 
                                    class="referee__matchup__content__team__avatar"
                                    :style="{ backgroundImage: `url(${matchup.team2?.avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }"
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
                                    @click="matchup.mp && runningLobby ? banchoCall('invite', { userID: member.osuID }) : tooltipText = 'Matchup has no lobby'"
                                >
                                    <div 
                                        class="referee__matchup__content__team__members__member__avatar"
                                        :style="{ backgroundImage: `url(https://a.ppy.sh/${member.osuID})` }"
                                        :class="{
                                            'referee__matchup__content__team__members__member__avatar--ready': member.ready,
                                        }"
                                    />
                                    {{ member.username }} ({{ member.osuID }}) {{ member.slot ? `Slot ${member.slot}` : '' }} {{ member.team ?? '' }} {{ member.mods ? `+${member.mods.toUpperCase()}` : "" }}
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="mapOrder.length > 0" 
                            class="referee__matchup__content__order"
                        >
                            Pickban Order<br>1 = Roll winner<br>2 = Roll loser<br>W = Winner so far in matchup<br>L = Loser so far in matchup<br>WP = Winner of previous map<br>LP = Loser of previous map
                            <div 
                                v-for="set in mapOrder"
                                :key="set.set"
                                class="referee__matchup__content__order__set"
                            >
                                <div 
                                    v-if="set.order.length === 0"
                                    class="referee__matchup__content__order__set_header"
                                >
                                    Set {{ set.set }}
                                </div>
                                <div class="referee__matchup__content__order__list">
                                    <div 
                                        v-for="map in set.order"
                                        :key="map.ID"
                                        class="referee__matchup__content__order__team"
                                        :style="{ 
                                            backgroundColor: (matchupSet?.maps?.length || 0) < (mapOrder.find(set => set.set === matchupSet?.order)?.order.length || 0) + map.order ? convertStatusEnum(map.status) : '#333333',
                                            boxShadow: (matchupSet?.maps?.length || 0) === (mapOrder.find(set => set.set === matchupSet?.order)?.order.length || 0) + map.order - 1 ? `0 0 10px ${convertStatusEnum(map.status)}` : 'none',
                                        }"
                                    >
                                        {{ convertOrderEnum(map.team) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ContentButton
                            class="referee__matchup__header__create_lobby__button content_button--red"
                            :class="{
                                'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                            }"
                            style="max-height: 40px;"
                            @click.native="matchup.mp && runningLobby && !mapStarted ? sendNextMapMessage() : mapStarted ? tooltipText = 'Matchup is currently playing a map' : tooltipText = 'Matchup has no lobby'"
                        >
                            {{ nextMapMessage }}
                        </ContentButton>
                        Matchup's Map List
                        <div
                            v-for="map in matchup.sets?.flatMap(set => set.maps || [])"
                            :key="map.ID"
                            class="referee__matchup__content__map"
                            :style="{backgroundColor: slotColour(selectedMappool?.slots.find(slot => slot.maps.some(m => m.ID === map.map.ID)))}"
                        >
                            <div
                                class="referee__matchup__content__map_delete"
                                @click="banchoCall('deleteMap', { mapID: map.ID })"
                            >
                                X
                            </div>
                            <div class="referee__matchup__content__map_name">
                                ({{ map.order }}) {{ selectedMappool?.slots.find(slot => slot.maps.some(m => m.ID === map.map.ID))?.acronym.toUpperCase() }}{{ map.map.order }} - {{ mapStatusToString(map.status) }}
                            </div>
                        </div>
                        <div v-if="matchup.sets?.flatMap(set => set.maps || []).length === 0">
                            No maps picked/banned/protected yet
                        </div>
                    </div>
                    <div class="referee__matchup__content_div">
                        Mappool:
                        <OpenSelect
                            :value="selectedMappool?.abbreviation.toUpperCase() || ''"
                            :options="mappoolSelector"
                            @change="selectedMappool = mappools.find(m => m.abbreviation.toLowerCase() === $event.toLowerCase()) || null"
                        />

                        <div
                            v-if="selectedMappool"
                            class="referee__matchup__content__mappool"
                        >
                            <div
                                v-for="slot in selectedMappool.slots"
                                :key="slot.ID"
                                class="referee__matchup__content__mappool__slot"
                                :style="{backgroundColor: slotColour(slot)}"
                            >
                                <div 
                                    class="referee__matchup__content__mappool__slot__name"
                                >
                                    {{ slot.name }}
                                </div>
                                <div
                                    v-for="map in slot.maps"
                                    :key="map.ID"
                                    class="referee__matchup__content__mappool__slot__map"
                                    :class="{ 'referee__matchup__content__mappool__slot__map--used': matchupSet?.maps?.some(m => m.map.ID === map.ID) }"
                                    @click="!matchup.mp || !runningLobby ? tooltipText = 'Matchup has no lobby' : matchupSet?.maps?.find(m => m.map.ID === map.ID) ? tooltipText = 'Map has been used already' : selectMap(map.ID)"
                                >
                                    <div class="referee__matchup__content__mappool__slot__map__name">
                                        {{ slot.acronym.toUpperCase() }}{{ slot.maps.length === 1 ? '' : map.order }}
                                    </div>
                                    <div class="referee__matchup__content__mappool__slot__map__beatmap">
                                        {{ map.beatmap?.beatmapset?.artist }} - {{ map.beatmap?.beatmapset?.title }} [{{ map.beatmap?.difficulty }}]
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="referee__matchup__footer">
                    <ContentButton
                        class="referee__matchup__footer__button content_button--red"
                        :link="'/referee'"
                    >
                        {{ $t('open.referee.back') }}
                    </ContentButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import { Centrifuge, ExtendedPublicationContext, Subscription } from "centrifuge";

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenSelect from "../../../Assets/components/open/OpenSelect.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import { Tournament } from "../../../Interfaces/tournament";
import { MapStatus, Matchup, MatchupSet } from "../../../Interfaces/matchup";
import { MapOrder, MapOrderTeam } from "../../../Interfaces/stage";
import { UserInfo } from "../../../Interfaces/user";
import { Mappool, MappoolMap, MappoolSlot } from "../../../Interfaces/mappool";
import { freemodButFreerRGB, freemodRGB, modsToRGB } from "../../../Interfaces/mods";
import { Team } from "../../../Interfaces/team";

const openModule = namespace("open");

interface playerState {
    ID: number;
    username: string;
    osuID: string;
    inLobby: boolean;
    ready: boolean;
    mods: string;
    slot: number;
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
        ContentButton,
        OpenSelect,
        OpenTitle,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament.description},
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
export default class Referee extends Vue {

    @State loggedInUser!: UserInfo | null;
    @openModule.State tournament!: Tournament | null;

    centrifuge: Centrifuge | null = null;
    matchupChannel: Subscription | null = null;

    matchup: Matchup | null = null;
    mappools: Mappool[] = [];
    mappoolSelector: {
        value: string;
        text: string;
    }[] = [];
    selectedMappool: Mappool | null = null;
    mapOrder: {
        set: number;
        order: MapOrder[];
    }[] = [];

    mapStarted = false;
    runningLobby = false;

    rollMenu = false;
    mapSelected: MappoolMap | null = null;

    team1PlayerStates: playerState[] = [];
    team2PlayerStates: playerState[] = [];

    mapTimer = "90";
    readyTimer = "90";

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
                    (message.user.osu.userID === "3" && (
                        message.content.startsWith("Room name:") ||
                        message.content.startsWith("Team mode:") ||
                        message.content.startsWith("Players:") ||
                        message.content.startsWith("Beatmap:") ||
                        message.content.startsWith("Active mods:") ||
                        message.content.startsWith("Slot")
                    )) || message.content.startsWith("!mp settings")
                )
            )
                return false;
            if (!this.showCorsaceMessages && message.user.osu.userID === "29191632" && !/<.+>: /.test(message.content))
                return false;
            return true;
        });
    }

    get matchupSet () {
        return this.matchup?.sets?.[this.matchup.sets.length - 1];
    }

    get nextMapMessage () {
        // TODO: Support sets, and don't hardcode no losing -> second and no winning -> first
        const score = `${this.matchup?.team1?.name ?? "TBD"} | ${this.matchupSet?.team1Score ?? this.matchup?.team1Score} - ${this.matchupSet?.team2Score ?? this.matchup?.team2Score} | ${this.matchup?.team2?.name ?? "TBD"}`;
        let bestOf = `BO${this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.filter(p => p.status === MapStatus.Picked).length + 1 ?? ""}`;
        if (this.mapOrder.length > 1)
            bestOf = `BO${this.mapOrder.length + 1 / 2} ${bestOf}`;
        const firstTo = this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.filter(p => p.status === MapStatus.Picked).length / 2 + 1;
        
        if (!this.matchupSet?.first)
            return `${score} // ${bestOf}`;

        let winner = this.matchup?.team1Score === firstTo ? this.matchup.team1?.name : this.matchup?.team2Score === firstTo ? this.matchup.team2?.name : null;
        if (this.mapOrder.length > 1) {
            winner = this.matchupSet?.team1Score === firstTo ? this.matchup?.team1?.name : this.matchupSet?.team2Score === firstTo ? this.matchup?.team2?.name : null;
        }
        const nextMap = (this.matchupSet?.maps?.length ?? 0) > this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.length ? null : this.mapOrder[(this.matchupSet?.order ?? 1) - 1].order[this.matchupSet?.maps?.length ?? 0];
    
        const first = this.matchupSet?.first?.name;
        const second = this.matchup?.team1?.ID === this.matchupSet?.first?.ID ? this.matchup?.team2?.name : this.matchup?.team2?.ID === this.matchupSet?.first?.ID ? this.matchup?.team1?.name : null;
    
        let winning = this.matchup?.team1Score && this.matchup?.team2Score ? this.matchup?.team1Score > this.matchup?.team2Score ? this.matchup?.team1?.name : this.matchup?.team2?.name : null;
        let losing = this.matchup?.team1Score && this.matchup?.team2Score ? this.matchup?.team1Score > this.matchup?.team2Score ? this.matchup?.team2?.name : this.matchup?.team1?.name : null;
        if (this.mapOrder.length > 1 && (this.matchupSet?.team1Score > 0 || this.matchupSet?.team2Score > 0)) {
            winning = this.matchupSet?.team1Score > this.matchupSet?.team2Score ? this.matchup?.team1?.name : this.matchupSet?.team1Score < this.matchupSet?.team2Score ? this.matchup?.team2?.name : null;
            losing = this.matchupSet?.team1Score > this.matchupSet?.team2Score ? this.matchup?.team2?.name : this.matchupSet?.team1Score < this.matchupSet?.team2Score ? this.matchup?.team1?.name : null;
        }
    
        const nextMapTeam = nextMap?.team === MapOrderTeam.Team1 ? first : nextMap?.team === MapOrderTeam.Team2 ? second : nextMap?.team === MapOrderTeam.TeamLoser ? losing ?? second : nextMap?.team === MapOrderTeam.TeamWinner ? winning ?? first : null;

        const winnerString = `${winner ?? "N/A"} has won the ${this.mapOrder.length > 1 ? "set" : "matchup"}!`;
        const nextMapString = `Next ${this.mapStatusToString(nextMap?.status ?? 0)}: ${nextMapTeam ?? "N/A"}`;

        return `${score} // ${bestOf} // ${winner ? winnerString : nextMapString}`;
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

    selectMap (mapID: number) {
        if (this.mapSelected?.ID === mapID) {
            this.mapSelected = null;
            return;
        }

        this.mapSelected = this.selectedMappool?.slots.flatMap(slot => slot.maps).find(map => map.ID === mapID) ?? null;
        if (this.$refs.mapStatusSelect instanceof HTMLElement && this.$refs.tooltip instanceof HTMLElement) {
            this.$refs.mapStatusSelect.style.left = this.$refs.tooltip.style.left;
            this.$refs.mapStatusSelect.style.top = this.$refs.tooltip.style.top;
        }
    }

    toggleRollMenu () {
        this.rollMenu = !this.rollMenu;
        if (!this.rollMenu)
            return;

        if (this.$refs.rollSelect instanceof HTMLElement && this.$refs.tooltip instanceof HTMLElement) {
            this.$refs.rollSelect.style.left = this.$refs.tooltip.style.left;
            this.$refs.rollSelect.style.top = this.$refs.tooltip.style.top;
        }
    }

    async mounted () {
        const { data: matchupData } = await this.$axios.get(`/api/referee/matchups/${this.tournament?.ID}/${this.$route.params.id}`);
        if (matchupData.error) {
            alert(matchupData.error);
            await this.$router.push("/");
            return;
        }

        this.matchup = matchupData.matchup ? {
            ...matchupData.matchup,
            date: new Date(matchupData.matchup.date),
        } : null;
        if (this.matchup && !this.matchup.sets)
            this.matchup.sets = [{
                ID: 0,
                order: 1,
                first: null,
                maps: [],
                team1Score: 0,
                team2Score: 0,
            }];

        this.team1PlayerStates = this.matchup?.team1?.manager ? [{
            ID: this.matchup.team1.manager.ID,
            username: this.matchup.team1.manager.username,
            osuID: this.matchup.team1.manager.osuID,
            inLobby: false,
            ready: false,
            mods: "",
            slot: 0,
        }] : [];
        this.team2PlayerStates = this.matchup?.team2?.manager ? [{
            ID: this.matchup.team2.manager.ID,
            username: this.matchup.team2.manager.username,
            osuID: this.matchup.team2.manager.osuID,
            inLobby: false,
            ready: false,
            mods: "",
            slot: 0,
        }] : [];

        this.team1PlayerStates.push(...(this.matchup?.team1?.members.map(member => ({
            ID: member.ID,
            username: member.username,
            osuID: member.osuID,
            inLobby: false,
            ready: false,
            mods: "",
            slot: 0,
        })) ?? []));
        this.team2PlayerStates.push(...(this.matchup?.team2?.members.map(member => ({
            ID: member.ID,
            username: member.username,
            osuID: member.osuID,
            inLobby: false,
            ready: false,
            mods: "",
            slot: 0,
        })) ?? []));

        this.team1PlayerStates = this.team1PlayerStates.filter((v, i, a) => a.findIndex(t => t.osuID === v.osuID) === i);
        this.team2PlayerStates = this.team2PlayerStates.filter((v, i, a) => a.findIndex(t => t.osuID === v.osuID) === i);

        this.messages = this.matchup?.messages?.map((message, i) => ({
            ...message,
            ID: i,
            timestamp: new Date(message.timestamp),
        })) ?? [];
        this.mapOrder = this.matchup?.round?.mapOrder?.map(o => o.set)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(s => ({
                set: s,
                order: this.matchup?.round?.mapOrder?.filter(o => o.set === s).sort((a, b) => a.order - b.order) ?? [],
            })) ?? this.matchup?.stage?.mapOrder?.map(o => o.set)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(s => ({
                set: s,
                order: this.matchup?.stage?.mapOrder?.filter(o => o.set === s).sort((a, b) => a.order - b.order) ?? [],
            })) ?? [];

        this.mappools = this.matchup?.round?.mappool ?? this.matchup?.stage?.mappool ?? [];
        this.mappoolSelector = this.mappools.map(mappool => ({
            value: mappool.abbreviation.toUpperCase(),
            text: mappool.abbreviation.toUpperCase(),
        }));
        this.selectedMappool = this.mappools[0] || null;
        
        this.mapTimer = `${this.tournament?.mapTimer ?? 90}`;
        this.readyTimer = `${this.tournament?.readyTimer ?? 90}`;

        const { data: centrifugoURL } = await this.$axios.get("/api/centrifugo/publicUrl");

        const centrifuge = new Centrifuge(`${centrifugoURL}/connection/websocket`, {

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

        this.matchupChannel = this.centrifuge.newSubscription(`matchup:${this.$route.params.id}`);

        this.matchupChannel.on("error", (err) => {
            alert("Error in console for matchup channel subscription");
            console.error("error", err);
        });

        this.matchupChannel.on("unsubscribed", (ctx) => {
            if (ctx.code === 102)
                alert("Couldn't find matchup channel");
            else if (ctx.code === 103)
                alert("Unauthorized to subscribe to matchup channel");
            else if (ctx.code !== 0) {
                alert("Error in console for matchup channel subscription");
                console.error("unsubscribed", ctx);
            } else
                console.log("unsubscribed", ctx);
        });

        this.matchupChannel.on("subscribed", (ctx) => {
            console.log("subscribed", ctx.channel);
        });

        this.matchupChannel.on("publication", this.handleData);

        this.matchupChannel.subscribe();

        if (this.matchup?.mp)
            await this.banchoCall("pulse");
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

    getTeamName (team: Team | null | undefined) {
        return team?.name ? team.name : "TBD";
    }

    getRollStatus (sets: MatchupSet[] | null | undefined, team: Team | null | undefined) {
        if (!sets?.length) return "";
        const lastSet = sets[sets.length - 1];
        if (!lastSet?.first) return "";
        return lastSet.first.ID === team?.ID ? "Roll won" : "Roll lost";
    }

    slotColour (slot?: MappoolSlot) {
        if (!slot)
            return this.RGBValuesToRGBCSS(modsToRGB(0));

        if (slot.allowedMods === null && slot.userModCount === null && slot.uniqueModCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreerRGB);

        if (slot.userModCount !== null || slot.uniqueModCount !== null)
            return this.RGBValuesToRGBCSS(freemodRGB);

        return this.RGBValuesToRGBCSS(modsToRGB(slot.allowedMods));
    }

    RGBValuesToRGBCSS (values: [number, number, number]) {
        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.333)`;
    }

    convertOrderEnum (num: MapOrderTeam): string {
        switch (num) {
            case MapOrderTeam.Team1:
                return "1";
            case MapOrderTeam.Team2:
                return "2";
            case MapOrderTeam.TeamLoser:
                return "L";
            case MapOrderTeam.TeamWinner:
                return "W";
            case MapOrderTeam.TeamLoserPrevious:
                return "LP";
            case MapOrderTeam.TeamWinnerPrevious:
                return "WP";
        }
    }

    convertStatusEnum (num: MapStatus): string {
        switch (num) {
            case MapStatus.Banned:
                return "#F24141";
            case MapStatus.Protected:
                return "#5BBCFA";
            case MapStatus.Picked:
                return "#3A8F5E";
        }
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

    handleData = (ctx: ExtendedPublicationContext) => {
        console.log("publication", ctx.channel, ctx.data);

        if (!ctx.channel.startsWith("matchup:"))
            return;
        const matchupID = parseInt(ctx.channel.split(":")[1]);
        if (matchupID !== this.matchup?.ID)
            return;

        switch (ctx.data.type) {
            case "created":
                this.matchup.baseURL = ctx.data.baseURL;
                this.matchup.mp = ctx.data.mpID;
                this.runningLobby = true;
                this.matchup.sets = [{
                    ...ctx.data.firstSet,
                    first: ctx.data.firstSet.first === this.matchup.team1?.ID ? this.matchup.team1 : ctx.data.firstSet.first === this.matchup.team2?.ID ? this.matchup.team2 : null,
                }];
                break;
            case "message":
                this.addMessage(ctx.data);
                break;
            case "first":
                this.$set(this.matchup.sets![this.matchup.sets!.length - 1], "first", ctx.data.first === this.matchup.team1?.ID ? this.matchup.team1 : this.matchup.team2); // In order to make the computed properties watchers work 
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
                        slot: slotPlayer?.slot,
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
                        slot: slotPlayer?.slot,
                    };
                });
                break;
            case "selectMap":
                if (!this.matchup.sets)
                    this.matchup.sets = [{
                        ID: 0,
                        order: 1,
                        first: null,
                        maps: [],
                        team1Score: 0,
                        team2Score: 0,
                    }];
                if (!this.matchup.sets?.[this.matchup.sets.length - 1]?.maps)
                    this.matchup.sets[this.matchup.sets.length - 1].maps = [];
                this.matchup.sets[this.matchup.sets.length - 1].maps!.push(ctx.data.map);
                this.mapSelected = null;
                break;
            case "matchStarted":
                this.mapStarted = true;
                break;
            case "matchAborted":
                this.mapStarted = false;
                break;
            case "matchFinished":
                this.mapStarted = false;
                this.matchup.team1Score = ctx.data.team1Score;
                this.matchup.team2Score = ctx.data.team2Score;
                this.matchup.sets![this.matchup.sets!.length - 1].maps!.push(ctx.data.map);
                this.matchup.sets![this.matchup.sets!.length - 1].team1Score = ctx.data.setTeam1Score;
                this.matchup.sets![this.matchup.sets!.length - 1].team2Score = ctx.data.setTeam2Score;
                break;
            case "closed":
                this.team1PlayerStates.forEach(player => player.inLobby = player.ready = false);
                this.team2PlayerStates.forEach(player => player.inLobby = player.ready = false);
                this.runningLobby = false;
                break;
        }
    };

    newSet () {
        if (!this.matchup?.sets)
            return;

        const firstTo = this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.filter(p => p.status === MapStatus.Picked).length / 2 + 1;
        if (this.matchup.sets[this.matchup.sets.length - 1].team1Score === firstTo || this.matchup.sets[this.matchup.sets.length - 1].team2Score === firstTo) {
            this.matchup.sets.push({
                ID: this.matchup.sets[this.matchup.sets.length - 1].ID + 1,
                order: this.matchup.sets.length + 1,
                first: null,
                maps: [],
                team1Score: 0,
                team2Score: 0,
            });
        }
    }

    async sendNextMapMessage () {
        await this.banchoCall("message", { message: this.nextMapMessage, username: this.loggedInUser?.osu.username });
        await this.banchoCall("timer", { time: parseInt(this.mapTimer) });
    }

    mapStatusToString (num: MapStatus): string {
        switch (num) {
            case MapStatus.Protected:
                return "Protect";
            case MapStatus.Banned:
                return "Ban";
            case MapStatus.Picked:
                return "Pick";
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
                endpoint === "roll" ||
                endpoint === "deleteMap"
            ) &&
            !confirm(`Are you sure you want to ${endpoint}?`)
        )
            return;

        if (endpoint === "deleteMap" && !confirm("Are you REALLY SURE you want to delete a map? If this is a pick, this is irreversible."))
            return;

        const { data: lobbyData } = await this.$axios.post(`/api/referee/bancho/${this.tournament?.ID}/${this.matchup.ID}`, {
            endpoint,
            ...data,
        });

        if (lobbyData.error) {
            if (endpoint === "pulse") {
                this.runningLobby = false;
                return;
            }

            alert(lobbyData.error);
            console.error(lobbyData.error, Object.keys(lobbyData.error));
            return;
        }

        if (endpoint === "pulse")
            this.runningLobby = lobbyData.pulse;

        if (endpoint === "deleteMap" && this.matchup.sets?.[data.set]) {
            this.matchup.sets[data.set].maps = this.matchup.sets[data.set].maps!.filter(map => map.ID !== data.mapID);
            this.matchup.sets[data.set].maps!.forEach((map, i) => map.order = i + 1);
        }

        switch (endpoint) {
            case "createLobby":
                this.tooltipText = "Lobby created";
                break;
            case "closeLobby":
                this.tooltipText = "Lobby closed";
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
            case "timer":
                this.tooltipText = "Timer set";
                break;
            case "selectMap":
                this.tooltipText = "Map selected";
                break;
            case "deleteMap":
                this.tooltipText = "Map deleted";
                break;
            case "startMap":
                this.tooltipText = "Map started";
                break;
            case "abortMap":
                this.tooltipText = "Map aborted";
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

    &__menu_select {
        position: fixed;
        transition: none;
        z-index: 10;

        background-color: #333333;
        padding: 10px;
        border-radius: 10px;

        flex-direction: column;
        gap: 10px;

        &__option {
            cursor: pointer;
            padding: 5px;
            border-radius: 5px;

            &--green {
                background-color: #3A8F5E;
            }

            &--red {
                background-color: #F24141;
            }

            &--blue {
                background-color: #5BBCFA;
            }

            &:hover {
                background-color: white;
                color: #181818;
            }
        }
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
                height: 40px;
            }
        }

        &__messages {
            overflow: hidden;

            grid-column: 3 / 4;
            grid-row: 1 / 4;

            &_wrapper {
                display: flex;
                flex-direction: column;
                gap: 5px;
                background-color: #181818;
                padding: 10px;
            }

            &__header {
                font-size: $font-lg;
                font-weight: bold;
            }

            &__container {
                overflow-y: scroll;
                height: 550px;

                &::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
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

            &__map {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                border-radius: 5px;

                &_delete {
                    color: $open-red;
                    cursor: pointer;
                }

                &_name {
                    font-size: $font-lg;
                    font-weight: bold;
                }
            }

            &__order {
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: #333333;
                padding: 10px;
                border-radius: 5px;

                &__set {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                &__list {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                &__team {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    width: 10px;
                    height: 10px;
                    gap: 5px;
                    padding: 10px;
                    border-radius: 5px;
                }
            }

            &__mappool {
                display: flex;
                flex-direction: column;
                gap: 10px;

                &__slot {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding: 10px;
                    border-radius: 5px;
                    background: #333333;

                    &__name {
                        font-size: $font-lg;
                        font-weight: 500;
                    }

                    &__map {
                        display: flex;
                        flex-direction: column;
                        padding: 10px;
                        border-radius: 5px;
                        background: #333333;
                        cursor: pointer;

                        &:hover {
                            background: #444444;
                        }

                        &--used {
                            cursor: not-allowed;
                            color: black;
                            background: black;

                            &:hover {
                                background: black;
                                color: white;
                            }
                        }

                        &__name {
                            font-size: $font-lg;
                            font-weight: 500;
                        }

                        &__beatmap {
                            font-size: $font-base;
                            font-weight: 300;
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
            grid-row: 3 / 4;

            &__button {
                max-width: 300px;
            }
        }
    }
}

</style>