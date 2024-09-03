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
                v-if="!matchupSet?.maps?.some(m => m.status === 0 && m.map.ID === mapSelected?.ID)"
                class="referee__menu_select__option referee__menu_select__option--blue"
                @click="banchoCall('selectMap', { mapID: mapSelected?.ID, status: 0, set: (matchupSet?.order || 1) - 1 }); mapSelected = null"
            >
                PROTECT
            </div>
            <div 
                v-if="!matchupSet?.maps?.some(m => m.status === 0 && m.map.ID === mapSelected?.ID)"
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
                @click="banchoCall('roll', { allowed: 'captains' }); rollMenu = false"
            >
                ONLY CAPTAINS ROLL
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
        <div
            ref="forfeitSelect"
            class="referee__menu_select"
            :style="{ display: forfeitMenu ? 'flex' : 'none' }"
        >
            <div 
                class="referee__menu_select__option referee__menu_select__option--red"
                @click="banchoCall('forfeit', { team: 1 }); forfeitMenu = false"
            >
                {{ matchup?.team1?.name }} FORFEIT / {{ matchup?.team2?.name }} WON
            </div>
            <div 
                class="referee__menu_select__option referee__menu_select__option--red"
                @click="banchoCall('forfeit', { team: 2 }); forfeitMenu = false"
            >
                {{ matchup?.team2?.name }} FORFEIT / {{ matchup?.team1?.name }} WON
            </div>
        </div>
        <div
            ref="firstSelect"
            class="referee__menu_select"
            :style="{ display: firstMenu ? 'flex' : 'none' }"
        >
            <div 
                class="referee__menu_select__option referee__menu_select__option--red"
                @click="banchoCall('first', { team: 1 }); firstMenu = false"
            >
                {{ matchup?.team1?.name }}
            </div>
            <div 
                class="referee__menu_select__option referee__menu_select__option--red"
                @click="banchoCall('first', { team: 2 }); firstMenu = false"
            >
                {{ matchup?.team2?.name }}
            </div>
        </div>
        <div class="referee__container">
            <OpenTitle>
                {{ $t('open.referee.title') }} {{ matchup ? `- (${matchup.matchID} | ${matchup.ID}) ${matchup.team1?.name || "TBD"} vs ${matchup.team2?.name || "TBD"}` : "" }}
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
                            'content_button--disabled': matchup.winner || (matchup.mp && runningLobby),
                        }"
                        @click.native="!matchup.winner && (!matchup.mp || !runningLobby) ? banchoCall('createLobby', { auto: false }) : tooltipText = 'Matchup already has a lobby'"
                    >
                        {{ $t('open.referee.createLobby') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || matchup.stage?.stageType === 0 || !runningLobby,
                        }"
                        @contextmenu.native.prevent="matchup.mp && runningLobby && matchup.stage?.stageType !== 0 ? toggleRollMenu() : tooltipText = 'Matchup has no lobby'"
                        @click.native="matchup.mp && runningLobby && matchup.stage?.stageType !== 0 ? toggleRollMenu() : tooltipText = 'Matchup has no lobby'"
                    >
                        {{ matchupSet?.first ? $t('open.referee.reroll') : $t('open.referee.roll') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp,
                        }"
                        @contextmenu.native.prevent="matchup.mp ? toggleFirstMenu() : tooltipText = 'Matchup has no mp'"
                        @click.native="matchup.mp ? toggleFirstMenu() : tooltipText = 'Matchup has no mp'"
                    >
                        {{ $t('open.referee.first') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                        }"
                        style="font-size: 12px;"
                        @click.native="matchup.mp && runningLobby && !mapStarted ? banchoCall('timer', { time: parseInt(mapTimer) }) : tooltipText = mapStarted ? 'Matchup is currently playing a map' : 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.timer') }} <input
                            v-model="mapTimer"
                            class="referee__matchup__messages__input"
                            style="width: 40px;"
                            @click.stop
                        >
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                        }"
                        style="font-size: 12px;"
                        @click.native="matchup.mp && runningLobby && !mapStarted ? banchoCall('timer', { time: parseInt(readyTimer) }) : tooltipText = mapStarted ? 'Matchup is currently playing a map' : 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.timer') }} <input
                            v-model="readyTimer"
                            class="referee__matchup__messages__input"
                            style="width: 40px;"
                            @click.stop
                        >
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                        }"
                        @click.native="matchup.mp && runningLobby && !mapStarted ? banchoCall('startMap') : tooltipText = mapStarted ? 'Matchup is currently playing a map' : 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.startMap') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': !matchup.mp || !runningLobby || !mapStarted,
                        }"
                        @click.native="matchup.mp && runningLobby && mapStarted ? banchoCall('abortMap') : tooltipText = !mapStarted ? 'Matchup is not currently playing a map' : 'Matchup has no lobby'"
                    >
                        {{ $t('open.referee.abortMap') }}
                    </ContentButton>
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': matchup.winner,
                        }"
                        @contextmenu.native.prevent="!matchup.winner ? toggleForfeitMenu() : tooltipText = 'Matchup has been finished'"
                        @click.native="!matchup.winner ? toggleForfeitMenu() : tooltipText = 'Matchup has been finished'"
                    >
                        {{ $t('open.referee.forfeit') }}
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
                    <ContentButton
                        class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                        :class="{
                            'content_button--disabled': runningLobby || postedResults,
                        }"
                        @click.native="!postedResults && !runningLobby ? postResults() : tooltipText = postedResults ? 'Result should have already been posted on discord' : 'Lobby is still running'"
                    >
                        {{ $t('open.referee.postResults') }}
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
                        <a
                            :href="`https://osu.ppy.sh/community/matches/${matchup.mp}`"
                            target="_blank"
                        >
                            MP Link
                        </a>
                        <div 
                            id="messageContainer"
                            class="referee__matchup__messages__container"
                            @scroll="checkScrollPosition"
                        > 
                            <div>
                                <div
                                    v-for="message in filteredMessages"
                                    :key="message.ID"
                                    class="referee__matchup__messages__message"
                                    :style="{
                                        color: message.user.osu.userID === '3' ? '#e98792' : message.user.osu.userID === '29191632' ? '#ef3255' : 'white',
                                        backgroundColor: keywordsArray.some(keyword => message.content.toLowerCase().includes(keyword.toLowerCase())) ? '#29a8f955' : 'transparent',
                                    }"
                                >
                                    <div class="referee__matchup__messages__message__timestamp">
                                        {{ formatTime(message.timestamp) }}
                                    </div>
                                    <div class="referee__matchup__messages__message__user">
                                        {{ message.user.osu.username }}:
                                    </div>
                                    <div
                                        class="referee__matchup__messages__message__content"
                                    >
                                        {{ message.content }}
                                    </div>
                                </div>
                            </div>
                            <transition
                                @before-enter="scrollButtonTransition"
                                @enter="scrollButtonTransition"
                                @leave="scrollButtonTransition"
                            >
                                <div
                                    v-if="showScrollBottom"
                                    class="referee__matchup__messages__container__scrollBottom"
                                    @click="scrollToBottom()"
                                >
                                    Scroll to bottom
                                </div>
                            </transition>
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
                        <div class="referee__matchup__messages__input_div">
                            <input
                                v-model="keywords"
                                class="referee__matchup__messages__input"
                                placeholder="Comma separated keywords to highlight..."
                                @input="saveToLocalStorage('keywords', $event)"
                            >
                        </div>
                    </div>
                </div>
                <div class="referee__matchup__content">
                    <div class="referee__matchup__content_div">
                        <div class="referee__matchup__content__settings">
                            <div>
                                time required between !mp settings (seconds)
                                <input
                                    v-model="settingsBuffer"
                                    class="referee__matchup__messages__input"
                                    style="width: 40px; flex: 0;"
                                    @input="saveToLocalStorage('settingsBuffer', $event)"
                                >
                            </div>
                            <ContentButton
                                class="referee__matchup__header__create_lobby__button content_button--red content_button--red_sm"
                                :class="{
                                    'content_button--disabled': !matchup.mp || !runningLobby || settingsRan,
                                }"
                                @click.native="!settingsRan && matchup.mp && runningLobby ? banchoCall('settings') : tooltipText = settingsRan ? `!mp settings has been ran within the past ${settingsBuffer} seconds` : 'Matchup has no lobby'"
                            >
                                {{ $t('open.referee.settings') }}
                            </ContentButton>
                        </div>
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
                            <div class="referee__matchup__content__team__stats_section">
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
                            <div class="referee__matchup__content__team__stats_section">
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
                                            backgroundColor: set.set < (matchupSet?.order || 0) || (matchupSet?.maps?.length || 0) < map.order ? convertStatusEnum(map.status) : '#333333',
                                            boxShadow: set.set === (matchupSet?.order || 0) && (matchupSet?.maps?.length || 0) + 1 === map.order ? `0 0 10px ${convertStatusEnum(map.status)}` : 'none',
                                        }"
                                    >
                                        {{ convertOrderEnum(map.team) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <input 
                                v-model="autoSendNextMapMessage"
                                class="referee__matchup__messages__checkboxes__checkbox"
                                type="checkbox"
                            >
                            Auto Send Next Map Message<br>(When roll winner is assigned, map is selected, or map is finished)
                        </div>
                        <ContentButton
                            class="referee__matchup__header__create_lobby__button content_button--red"
                            :class="{
                                'content_button--disabled': !matchup.mp || !runningLobby || mapStarted,
                            }"
                            style="max-height: 40px;"
                            @click.native="matchup.mp && runningLobby && !mapStarted ? sendNextMapMessage() : tooltipText = mapStarted ? 'Matchup is currently playing a map' : 'Matchup has no lobby'"
                        >
                            {{ nextMapMessage }}
                        </ContentButton>
                        Matchup's Map List
                        <div
                            v-for="map in matchup.sets?.flatMap(set => set.maps || [])"
                            :key="map.ID"
                            class="referee__matchup__content__map"
                            :style="{backgroundColor: convertStatusEnum(map.status)}"
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
                                    :class="{ 'referee__matchup__content__mappool__slot__map--used': matchupSet?.maps?.filter(m => m.status !== 0).some(m => m.map.ID === map.ID) }"
                                    @contextmenu.prevent="!matchup.mp ? tooltipText = 'Matchup has no mp' : matchupSet?.maps?.filter(m => m.status !== 0).find(m => m.map.ID === map.ID) ? tooltipText = 'Map has been used already' : selectMap(map.ID)"
                                    @click="!matchup.mp ? tooltipText = 'Matchup has no mp' : matchupSet?.maps?.filter(m => m.status !== 0).find(m => m.map.ID === map.ID) ? tooltipText = 'Map has been used already' : selectMap(map.ID)"
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
import { Mixins, Component, Watch } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import { ExtendedPublicationContext } from "centrifuge";
import CentrifugeMixin from "../../../Assets/mixins/centrifuge";

import ContentButton from "../../../Assets/components/open/ContentButton.vue";
import OpenSelect from "../../../Assets/components/open/OpenSelect.vue";
import OpenTitle from "../../../Assets/components/open/OpenTitle.vue";
import { Tournament } from "../../../Interfaces/tournament";
import { MapStatus, Matchup, MatchupSet, MatchupMessageBasic } from "../../../Interfaces/matchup";
import { MapOrder, MapOrderTeam } from "../../../Interfaces/stage";
import { UserInfo } from "../../../Interfaces/user";
import { Mappool, MappoolMap, MappoolSlot } from "../../../Interfaces/mappool";
import { freemodButFreerRGB, freemodRGB, modsToRGB } from "../../../Interfaces/mods";
import { Team } from "../../../Interfaces/team";
import { TournamentRoleType } from "../../../Interfaces/tournament";
import { OpenStaffInfo } from "../../../Interfaces/staff";

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
export default class Referee extends Mixins(CentrifugeMixin) {

    @State loggedInUser!: UserInfo | null;
    @openModule.State tournament!: Tournament | null;
    @openModule.State staffInfo!: OpenStaffInfo | null;

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
    postedResults = false;
    
    settingsBuffer = 5;
    settingsRan = false;

    firstMenu = false;
    forfeitMenu = false;
    rollMenu = false;
    mapSelected: MappoolMap | null = null;

    team1PlayerStates: playerState[] = [];
    team2PlayerStates: playerState[] = [];

    mapTimer = "90";
    readyTimer = "90";

    inputMessage = "";
    keywords = "";
    showScrollBottom = false;
    fetchedAllMessages = true;
    loadingMessages = false;
    messages: MatchupMessageBasic[] = [];
    showBanchoMessages = true;
    showBanchoSettings = false;
    showCorsaceMessages = true;
    autoSendNextMapMessage = false;

    get filteredMessages (): MatchupMessageBasic[] {
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

    get keywordsArray () {
        if (!this.keywords)
            return [];
        return this.keywords.split(",").map(keyword => keyword.trim());
    }

    get nextMapMessage () {
        // TODO: Support sets
        const score = `${this.matchup?.team1?.name ?? "TBD"} | ${Number.isInteger(this.matchupSet?.team1Score) ? this.matchupSet?.team1Score : this.matchup?.team1Score} - ${Number.isInteger(this.matchupSet?.team2Score) ? this.matchupSet?.team2Score : this.matchup?.team2Score} | ${this.matchup?.team2?.name ?? "TBD"}`;
        let bestOf = `BO${this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.filter(p => p.status === MapStatus.Picked).length + 1 ?? ""}`;
        if (this.mapOrder.length > 1)
            bestOf = `BO${this.mapOrder.length + 1 / 2} ${bestOf}`;
        const firstTo = this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.filter(p => p.status === MapStatus.Picked).length / 2 + 1;

        if (!this.matchupSet?.first)
            return `${score} // ${bestOf}`;

        let winner = this.matchupSet?.team1Score === firstTo ? this.matchup?.team1?.name : this.matchupSet?.team2Score === firstTo ? this.matchup?.team2?.name : null;
        if (this.mapOrder.length > 1) {
            winner = this.matchup?.team1Score === firstTo ? this.matchup.team1?.name : this.matchup?.team2Score === firstTo ? this.matchup.team2?.name : null;
        }
        const nextMap = (this.matchupSet?.maps?.length ?? 0) > this.mapOrder[(this.matchupSet?.order ?? 1) - 1]?.order.length ? null : this.mapOrder[(this.matchupSet?.order ?? 1) - 1].order[this.matchupSet?.maps?.length ?? 0];
    
        const first = this.matchupSet?.first?.name;
        const second = this.matchup?.team1?.ID === this.matchupSet?.first?.ID ? this.matchup?.team2?.name : this.matchup?.team2?.ID === this.matchupSet?.first?.ID ? this.matchup?.team1?.name : null;
    
        // TODO: Don't hardcode no losing -> second and no winning -> first
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
        this.showScrollBottom = false;
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

    updateTooltipPosition (event: MouseEvent) {
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

    toggleForfeitMenu () {
        this.forfeitMenu = !this.forfeitMenu;
        if (!this.forfeitMenu)
            return;

        if (this.$refs.forfeitSelect instanceof HTMLElement && this.$refs.tooltip instanceof HTMLElement) {
            this.$refs.forfeitSelect.style.left = this.$refs.tooltip.style.left;
            this.$refs.forfeitSelect.style.top = this.$refs.tooltip.style.top;
        }
    }

    toggleFirstMenu () {
        this.firstMenu = !this.firstMenu;
        if (!this.firstMenu)
            return;

        if (this.$refs.firstSelect instanceof HTMLElement && this.$refs.tooltip instanceof HTMLElement) {
            this.$refs.firstSelect.style.left = this.$refs.tooltip.style.left;
            this.$refs.firstSelect.style.top = this.$refs.tooltip.style.top;
        }
    }

    async mounted () {
        if (!this.staffInfo || (!this.staffInfo.userRoles.includes(TournamentRoleType.Organizer) && !this.staffInfo.userRoles.includes(TournamentRoleType.Referees))) {
            await this.$router.push("/");
            return;
        }

        const { data: matchupData } = await this.$axios.get<{ matchup: Matchup }>(`/api/referee/matchups/${this.tournament?.ID}/${this.$route.params.id}`);
        if (!matchupData.success) {
            alert(matchupData.error);
            await this.$router.push("/");
            return;
        }

        this.matchup = matchupData.matchup ? {
            ...matchupData.matchup,
            date: new Date(matchupData.matchup.date),
        } : null;
        if (this.matchup && (!this.matchup.sets || this.matchup.sets.length === 0))
            this.matchup.sets = [{
                ID: 0,
                order: 1,
                first: null,
                maps: [],
                team1Score: 0,
                team2Score: 0,
            }];

        this.team1PlayerStates = this.matchup?.team1?.captain ? [{
            ID: this.matchup.team1.captain.ID,
            username: this.matchup.team1.captain.username,
            osuID: this.matchup.team1.captain.osuID,
            inLobby: false,
            ready: false,
            mods: "",
            slot: 0,
        }] : [];
        this.team2PlayerStates = this.matchup?.team2?.captain ? [{
            ID: this.matchup.team2.captain.ID,
            username: this.matchup.team2.captain.username,
            osuID: this.matchup.team2.captain.osuID,
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

        this.keywords = localStorage.getItem("keywords") ?? "";
        this.settingsBuffer = parseInt(localStorage.getItem("settingsBuffer") ?? "5");

        await this.initCentrifuge(`matchup:${this.$route.params.id}`);
        try {
            const history = await this.subscription?.history({ limit: -1 });
            console.log("history", `matchup:${this.$route.params.id}`, history);
            (history?.publications as ExtendedPublicationContext[]).filter(p => p.data.type === "message").forEach(p => this.addMessage(p.data));
        } catch (error) {
            console.error(error);
        }

        await this.loadMessages(true);

        if (this.matchup?.mp)
            await this.banchoCall("pulse");
    }

    updated () {
        this.checkScrollPosition().catch(console.error);
    }

    scrollButtonTransition (e: HTMLElement) {
        e.style.opacity = this.showScrollBottom ? "1" : "0";
        e.style.height = this.showScrollBottom ? "50px" : "0";
    }

    saveToLocalStorage (type: string, e: InputEvent) {
        const target = e.target as HTMLInputElement;
        localStorage.setItem(type, target.value);
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
            this.showScrollBottom = false;
            setTimeout(() => { 
                const messageContainerNew = document.getElementById("messageContainer")!;
                messageContainerNew.scrollTo({
                    top: messageContainerNew.scrollHeight,
                    behavior: "smooth",
                });
            }, 100);
        } else
            this.showScrollBottom = true;
    }

    async loadMessages (toBottom: boolean) {
        this.loadingMessages = true;
        try {
            let messageContainer = document.getElementById("messageContainer");
            let currentScrollHeight = 0;
            if (messageContainer) // Null in the case of mounted and no mp property
                currentScrollHeight = messageContainer.scrollHeight;
            const { data: messagesData } = await this.$axios.get<{ messages: MatchupMessageBasic[] }>(`/api/referee/matchups/${this.tournament?.ID}/${this.matchup?.ID}/messages${this.messages[0]?.ID ? `?before=${this.messages[0]?.ID}` : ""}`);
            if (!messagesData.success) {
                alert("Failed to fetch messages. Check console for more information.");
                console.error(messagesData.error);
                this.fetchedAllMessages = true;
            } else {
                const newMessages = messagesData.messages.map(message => ({
                    ...message,
                    timestamp: new Date(message.timestamp),
                })).reverse();

                // If messages were obtained from centrifuge history and this is the first time loading messages, there may be duplicates (based on content, and timestamp, see https://github.com/Corsace/corsace/blob/master/BanchoBot/functions/tournaments/matchup/runMatchup.ts#L234) with different IDs, so this removes the duplicates obtained from centrifuge history
                if (this.messages.length > 0 && newMessages.length > 0 && this.messages[0].ID === 0) {
                    // Centrifuge history messages will have an ID based on the length of the messages array, so this can be used to loop and break, as messages from the DB will have a completely different ID
                    for (let i = 0; i < this.messages.length; i++) {
                        if (this.messages[i].ID !== i) 
                            break;

                        if (this.messages[i].content === newMessages[newMessages.length - 1].content && this.messages[i].timestamp.getTime() === newMessages[newMessages.length - 1].timestamp.getTime())
                            this.messages.shift();
                    }
                }

                this.messages = [
                    ...newMessages,
                    ...this.messages,
                ];

                this.fetchedAllMessages = messagesData.messages.length !== 50;
                
                await this.$nextTick();
                messageContainer = document.getElementById("messageContainer"); // In case it was null before and now it's not
                if (messageContainer && messageContainer.scrollHeight === messageContainer.clientHeight && !this.fetchedAllMessages) {
                    await this.loadMessages(toBottom);
                    return;
                }

                if (toBottom)
                    this.scrollToBottom();
                else if (messageContainer) {
                    const newScrollHeight = messageContainer.scrollHeight;
                    messageContainer.scrollTo({
                        top: messageContainer.scrollTop + newScrollHeight - currentScrollHeight,
                        behavior: "auto",
                    });
                }
            }
        } catch (error) {
            alert("Failed to fetch messages. Check console for more information.");
            console.error(error);
            this.fetchedAllMessages = true;
        } finally {
            this.loadingMessages = false;
        }
    }

    scrollToBottom () {
        const messageContainer = document.getElementById("messageContainer");
        if (!messageContainer)
            return;

        messageContainer.scrollTo({
            top: messageContainer?.scrollHeight,
            behavior: "smooth",
        });
        this.showScrollBottom = false;
    }

    async checkScrollPosition () {
        const messageContainer = document.getElementById("messageContainer");
        if (!messageContainer)
            return;

        this.showScrollBottom = messageContainer.scrollTop + messageContainer.clientHeight !== messageContainer.scrollHeight;
        if (messageContainer.scrollTop < 100 && !this.fetchedAllMessages && !this.loadingMessages)
            await this.loadMessages(false);
    }

    handleData (ctx: ExtendedPublicationContext) {
        console.log("publication", ctx.channel, ctx.data);

        if (!ctx.channel.startsWith("matchup:"))
            return;
        const matchupID = parseInt(ctx.channel.split(":")[1]);
        if (matchupID !== this.matchup?.ID)
            return;

        switch (ctx.data.type) {
            case "created": {
                const firstSet = ctx.data.firstSet;
                this.matchup.baseURL = ctx.data.baseURL;
                this.matchup.mp = ctx.data.mpID;
                this.runningLobby = true;
                this.matchup.sets = [{
                    ...firstSet,
                    maps: [],
                    first: firstSet.first === this.matchup.team1?.ID ? this.matchup.team1 : firstSet.first === this.matchup.team2?.ID ? this.matchup.team2 : null,
                }];
                break;
            }
            case "message":
                this.addMessage(ctx.data);
                break;
            case "first":
                this.$set(this.matchup.sets![this.matchup.sets!.length - 1], "first", ctx.data.first === this.matchup.team1?.ID ? this.matchup.team1 : this.matchup.team2); // In order to make the computed properties watchers work 
                if (this.autoSendNextMapMessage)
                    this.sendNextMapMessage()
                        .catch(console.error);
                break;
            case "settings": {
                const settingsCurrentlyRunning = this.settingsRan; // If the bot runs !mp settings by itself during the buffer time
                this.settingsRan = true;
                const slots = ctx.data.slots;
                this.team1PlayerStates = this.team1PlayerStates.map<playerState>(player => {
                    const slotPlayer = slots.find(slot => slot.playerOsuID === parseInt(player.osuID));
                    player.inLobby = slotPlayer !== undefined;
                    player.ready = slotPlayer?.ready ?? false;
                    player.team = slotPlayer?.team;
                    player.mods = slotPlayer?.mods ?? "";
                    player.slot = slotPlayer?.slot ?? 0;
                    return player;
                });
                this.team2PlayerStates = this.team2PlayerStates.map<playerState>(player => {
                    const slotPlayer = slots.find(slot => slot.playerOsuID === parseInt(player.osuID));
                    player.inLobby = slotPlayer !== undefined;
                    player.ready = slotPlayer?.ready ?? false;
                    player.team = slotPlayer?.team;
                    player.mods = slotPlayer?.mods ?? "";
                    player.slot = slotPlayer?.slot ?? 0;
                    return player;
                });
                if (!settingsCurrentlyRunning)
                    setTimeout(() => {
                        this.settingsRan = false;
                    }, this.settingsBuffer * 1000);
                break;
            }
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
                if (this.autoSendNextMapMessage)
                    this.sendNextMapMessage()
                        .catch(console.error);
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
                if (ctx.data.setWinner && this.mapOrder.length === 1)
                    this.matchup.winner = this.matchup.team1?.ID === ctx.data.setWinner ? this.matchup.team1 : this.matchup.team2?.ID === ctx.data.setWinner ? this.matchup.team2 : null;
                if (this.autoSendNextMapMessage)
                    this.sendNextMapMessage()
                        .catch(console.error);
                break;
            case "closed":
                this.team1PlayerStates.forEach(player => player.inLobby = player.ready = false);
                this.team2PlayerStates.forEach(player => player.inLobby = player.ready = false);
                this.runningLobby = false;
                break;
        }
    }

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

    async postResults () {
        if (!this.matchup) {
            this.tooltipText = "No matchup selected";
            return;
        }
    
        const { data } = await this.$axios.post<{ message: string }>(`/api/referee/matchups/${this.tournament?.ID}/${this.$route.params.id}/postResults`, {
            matchID: this.matchup.matchID,
            stage: this.matchup.round?.name ?? this.matchup.stage?.name ?? "",
            team1Score: this.matchup.forfeit || this.mapOrder.length > 1 ? this.matchup.team1Score : this.matchup.sets?.[0].team1Score,
            team2Score: this.matchup.forfeit || this.mapOrder.length > 1 ? this.matchup.team2Score : this.matchup.sets?.[0].team2Score,
            team1Name: this.matchup.team1?.name,
            team2Name: this.matchup.team2?.name,
            forfeit: this.matchup.forfeit,
            mpID: this.matchup.mp,
            sets: this.matchup.sets?.map(set => {
                const first = set.first;
                const second = this.matchup!.team1?.ID === first?.ID ? this.matchup!.team2 : this.matchup!.team2?.ID === first?.ID ? this.matchup!.team1 : null;
                return {
                    set: set.order,
                    maps: set.maps?.map(map => {
                        const slot = this.mappools.flatMap(m => m.slots).find(s => s.maps.some(m => m.ID === map.map.ID));
                        const mappoolMap = slot?.maps.find(m => m.ID === map.map.ID);
                        const mapOrder = this.mapOrder.find(o => o.set === set.order)?.order.find(o => o.order === map.order);
                        return {
                            name: `${slot?.acronym.toUpperCase()}${slot?.maps.length === 1 ? "" : mappoolMap?.order } | ${mappoolMap?.beatmap?.beatmapset?.artist} - ${mappoolMap?.beatmap?.beatmapset?.title} [${mappoolMap?.beatmap?.difficulty}]`,
                            status: map.status,
                            team: mapOrder?.team === MapOrderTeam.Team1 ? first?.name : mapOrder?.team === MapOrderTeam.Team2 ? second?.name : "N/A",
                        };
                    }) ?? [],
                };
            }) ?? [],
        });
        if (!data.success) {
            alert(data.error);
            return;
        }

        this.tooltipText = data.message;
        this.postedResults = true;
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

        const { data: lobbyData } = await this.$axios.post<{ pulse?: boolean }>(`/api/referee/bancho/${this.tournament?.ID}/${this.matchup.ID}`, {
            endpoint,
            ...data,
        });

        if (!lobbyData.success) {
            if (endpoint === "pulse") {
                this.runningLobby = false;
                return;
            }

            alert(lobbyData.error);
            console.error(lobbyData.error, Object.keys(lobbyData.error));
            return;
        }

        if (endpoint === "pulse" && lobbyData.pulse)
            this.runningLobby = lobbyData.pulse;

        if (endpoint === "deleteMap" && this.matchup.sets?.[data.set]) {
            this.matchup.sets[data.set].maps = this.matchup.sets[data.set].maps!.filter(map => map.ID !== data.mapID);
            this.matchup.sets[data.set].maps!.forEach((map, i) => map.order = i + 1);
        }

        if (endpoint === "forfeit") {
            this.matchup.winner = this.matchup.team1?.ID === data.team ? this.matchup.team2 : this.matchup.team2?.ID === data.team ? this.matchup.team1 : null;
            this.matchup.forfeit = true;
            this.matchup.team1Score = this.matchup.team1?.ID === data.team ? 0 : 1;
            this.matchup.team2Score = this.matchup.team2?.ID === data.team ? 0 : 1;
        }

        switch (endpoint) {
            case "createLobby":
                this.tooltipText = "Lobby created";
                break;
            case "closeLobby":
                this.tooltipText = "Lobby closed";
                break;
            case "forfeit":
                this.tooltipText = `Match forfeited by ${data.team === "1" ? this.matchup.team1?.name : this.matchup.team2?.name}`;
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
            case "first":
                this.tooltipText = `First team set to ${data.team === "1" ? this.matchup.team1?.name : this.matchup.team2?.name}`;
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
            flex-wrap: wrap;
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
                overflow-x: hidden;
                overflow-wrap: anywhere;
                height: 550px;
                position: relative;

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

                &__scrollBottom {
                    position: sticky;
                    background-color: rgba(0, 0, 0, 0.5);
                    width: 100%;
                    bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
            } 

            &__message {
                display: flex;
                align-items: baseline;
                gap: 5px;
                padding-left: 2px;

                &__timestamp {
                    font-size: $font-sm;
                }
                &__user {
                    font-weight: bold;
                    white-space: nowrap;
                }
                &__content {
                    flex: 1;
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
            flex-wrap: wrap;
            gap: 10px;

            grid-column: 1 / 3;

            &_div {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            &__settings {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                justify-content: center;
            }

            &__team {
                display: flex;
                flex-direction: column;
                gap: 5px;

                &__name {
                    font-size: $font-xxl;
                    font-weight: bold;
                }

                &__stats {
                    width: 150px;
                    height: 50px;
                    font-size: $font-xxl;
                    font-weight: bold;

                    &_section {
                        display: flex;
                        gap: 5px;
                    }
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
                        font-size: $font-base;
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
                            font-size: $font-base;
                            font-weight: 500;
                        }

                        &__beatmap {
                            font-size: $font-sm;
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