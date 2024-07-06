<template>
    <div class="info">
        <SubHeader
            :selections="[
                { text: $t('open.info.title'), value: 'info' },
                { text: $t('open.info.condensed'), value: 'condensed' },
            ]"
            :current-page="page"
            @update:page="page = $event"
        />
        <div class="info_wrapper">
            <OpenTitle v-if="page === 'condensed'">
                {{ $t('open.info.title') }}
            </OpenTitle>
            <div
                v-if="tournament && page === 'info'"
                class="info_main info_section"
            >
                <div class="info_desc__text">
                    {{ tournament.description }}
                </div>
                <div class="info_desc__buttons">
                    <ContentButton 
                        class="content_button--red info_desc_button content_button--margin"
                        link="https://paypal.me/corsaceofficial"
                        external
                    >
                        {{ $t('open.info.donateToCorsace') }}
                    </ContentButton>
                    <ContentButton 
                        class="content_button--red info_desc_button content_button--margin"
                        link="http://momokai.com/corsace"
                        external
                    >
                        {{ $t('open.info.supportViaSponsorship') }}
                    </ContentButton>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.generalInfo') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>Corsace Open is a <strong>4v4</strong>, <strong>international</strong> tournament open to players of <strong>all ranks</strong></li>
                        <li>All matches are played using <strong>Team VS</strong>, <strong>ScoreV2</strong></li>
                        <li>All scheduling shall be done in <strong>UTC</strong></li>
                        <li>All matches must take place between <strong>Friday 23:59 UTC</strong> and<strong> Sunday 23:59 UTC</strong></li>
                        <li>Reschedules must be submitted before <strong>Thursdays at 23:59 UTC</strong> the week a round is to take place. Exceptions are made on a case-by-case basis</li>
                        <li>Staff are <strong>prohibited</strong> from playing and/or acting as captains in the tournament with the exception of<strong> streamers</strong>, <strong>commentators</strong>, and <strong>GFX artists</strong></li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.prizes') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>
                            <strong>1st Place</strong>:
                            <ul>
                                <li>50% of prizepool split among players and their captain how they wish</li>
                                <li>(Pending) Corsace Open 1st place badge</li>
                            </ul>
                        </li>
                        <li>
                            <strong>2nd Place</strong>:
                            <ul>
                                <li>30% of prizepool split among players and their captain how they wish</li>
                                <li>(Pending) Corsace Open 2nd place badge</li>
                            </ul>
                        </li>
                        <li>
                            <strong>3rd Place</strong>:
                            <ul>
                                <li>20% of prizepool split among players and their captain how they wish</li>
                                <li>(Pending) Corsace Open 3rd place badge</li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.teamStructure') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>Teams may consist of <strong>6 - 8</strong> players </li>
                        <li>
                            Team names may consist of 3 - 20 characters with acronyms of 2 - 4 letters along with a team photo
                            <ul>
                                <li>Inappropriate pictures, names, and/or acronyms are subject to change at the discretion of administration</li>
                            </ul>
                        </li>
                        <li>
                            Teams must designate a <strong>single timezone</strong> to be used for scheduling (EX: UTC-7, UTC+2, UTC-4, etc.)
                            <ul>
                                <li>
                                    Teams shall be <strong>guaranteed</strong> a match time within the hours of <strong>10:00 - 22:00</strong> in accordance with the timezone used when registering
                                    <ul>
                                        <li>Teams are <strong>expected</strong> to be available for <strong>4</strong> <strong>weekends</strong> to play <strong>1 - 3 matches</strong> that last <strong>45 - 90 minutes</strong> within the <strong>10:00 - 22:00</strong> time frame for Saturday <strong>and</strong> Sunday</li>
                                        <li>Due to the guaranteed time, schedules will be made with streamers in mind</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.qualifiersProcedures') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>Teams shall have their own lobby run by the Corsace bot</li>
                        <li>The deadline to play qualifiers to complete registration is <strong>July 28 at 23:59 UTC</strong></li>
                        <li>The mappool consists of <strong>10 maps</strong> (<strong>3 NM</strong><strong> / </strong><strong>2 HD</strong><strong> / </strong><strong>2 HR</strong><strong> / </strong><strong>3 DT</strong>) and shall be played <strong>ONCE</strong>, starting from NM1 and ending in DT3</li>
                        <li>90 second timers are used for teams to swap members and ready up</li>
                        <li>
                            Teams<strong> complete registration</strong> by playing qualifiers
                            <ul class="info_desc__list">
                                <li>Rosters are<strong> locked </strong>after play. Changes are <strong>not</strong> allowed under any circumstance</li>
                                <li>Due to this process, teams with players who are <strong>screened out</strong> will automatically be <strong>disqualified</strong></li>
                            </ul>
                        </li>
                        <li>Qualifier results are calculated using z-score</li>
                    </ul>
                    <h2>SEEDING</h2>
                    <ul class="info_desc__list">
                        <li><strong>16 teams </strong>qualify and are split into <strong>two tiers</strong></li>
                        <li>
                            <strong>Tier 1 </strong>(Seeds 1 - 4)
                            <ul class="info_desc__list">
                                <li>Advances and is placed into the Upper Bracket in Week 2</li>
                                <li>Does not play in Week 1</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Tier 2</strong> (Seeds 5 - 16)
                            <ul class="info_desc__list">
                                <li>Moves on to Week 1, it is a group stage consisting of 4 groups of 3 teams</li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.tournamentStructure') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>The tournament consists of <strong>4 stages of play: </strong> Week 1, Week 2, Week 3, Week 4</li>
                        <li>Knockout 1 and Knockout 2 are considered the <strong>main bracket</strong> in the tournament with Round Robin and Runoff being used to supplement the remaining teams.</li>
                    </ul>
                    <h2>WEEK 1 (AUG 10 - 11)</h2>
                    <div class="info_desc__list_wrapper">
                        <ul class="info_desc__list">
                            <li>
                                <strong>Groups </strong>(12 teams, 12 matches)
                                <ul class="info_desc__list">
                                    <li>Group A (Seeds 5, 12, 13)</li>
                                    <li>Group B (Seeds 6, 11, 14)</li>
                                    <li>Group C (Seeds 7, 10, 15)</li>
                                    <li>Group D (Seeds 8, 9, 16)</li>
                                </ul>
                            </li>
                            
                            <li>
                                <strong>Placements:</strong>
                                <ul class="info_desc__list">
                                    <li>
                                        Group placement and W2 seeding is in the following precedence:
                                        <ul class="info_desc__list">
                                            <li>Match W/L Ratio</li>
                                            <li>Points Won</li>
                                            <li>Difference in Points (Points Won - Points Lost)</li>
                                        </ul>
                                    </li>
                                    <li><strong>1st:</strong> Moves into the Middle Bracket of Week 2</li>
                                    <li><strong>2nd:</strong> Moves into the Lower Bracket of Week 3</li>
                                    <li><strong>3rd:</strong> <red>ELIMINATED</red></li>
                                </ul>
                            </li>
                            <li>Matches are <strong>Best of 11</strong> with <strong>2 bans</strong> and <strong>1 protect</strong></li>
                            <li>Mappool size (17 maps): <strong>5 NM</strong><strong> / </strong><strong>3 HD</strong><strong> / </strong><strong>3 HR</strong><strong> / </strong><strong>3 DT</strong><strong> / </strong><strong>2 FM</strong><strong> / 1 TB</strong></li>
                        </ul>
                        <img
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--small"
                            src="../../Assets/img/site/open/info/w1.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>WEEK 2 (AUG 17 - 18)</h2>
                    <div class="info_desc__list_wrapper">
                        <ul class="info_desc__list">
                            <li>Triple bracket (Upper, Middle, Lower)</li>
                            <li>Upper bracket: Seeds 1 - 4</li>
                            <li>Middle bracket: 1st out of Groups</li>
                            <li>Lower bracket: 2nd out of Groups</li>
                            <li>
                                <strong>Round 1 </strong>(12 teams, 6 matches)
                                <ul class="info_desc__list">
                                    <li>LB Losers are <red>ELIMINATED</red></li>
                                </ul>
                            </li>
                            <li>
                                <strong>Round 2 </strong>(8 teams, 4 matches)
                                <ul class="info_desc__list">
                                    <li>UB losers go against MB winners</li>
                                    <li>MB losers go against LB winners</li>
                                    <li>LB losers are <red>ELIMINATED</red></li>
                                </ul>
                            </li>
                            <li>Matches are <strong>Best of 11</strong> with <strong>2 bans</strong> and <strong>1 protect</strong></li>
                            <li>Mappool size (17 maps): <strong>5 NM</strong><strong> / </strong><strong>3 HD</strong><strong> / </strong><strong>3 HR</strong><strong> / </strong><strong>3 DT</strong><strong> / </strong><strong>2 FM</strong><strong> / 1 TB</strong></li>
                        </ul>
                        <img 
                            class="info_desc__list_wrapper__image"
                            src="../../Assets/img/site/open/info/w2.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>WEEK 3 (AUG 24 - 25)</h2>
                    <div class="info_desc__list_wrapper">
                        <ul class="info_desc__list">
                            <li>Double bracket</li>
                            <li>
                                <strong>Round 1 </strong>(8 teams, 4 matches)
                                <ul class="info_desc__list">
                                    <li>LB Losers are <red>ELIMINATED</red></li>
                                </ul>
                            </li>
                            <li>
                                <strong>Round 2 </strong>(6 teams, 3 matches)
                                <ul class="info_desc__list">
                                    <li>UB winners go against each other</li>
                                    <li>UB losers go against LB winners</li>
                                    <li>LB losers are <red>ELIMINATED</red></li>
                                </ul>
                            </li>
                            <li>Matches are <strong>Best of 13</strong> with <strong>2 bans</strong> and <strong>1 protect</strong></li>
                            <li>Mappool size (20 maps): <strong>5 NM</strong><strong> / </strong><strong>4 HD</strong><strong> / </strong><strong>4 HR</strong><strong> / </strong><strong>4 DT</strong><strong> / </strong><strong>2 FM</strong><strong> / 1 TB</strong></li>
                        </ul>
                        <img 
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w3.png"
                        >
                    </div>
                    <hr class="line--red line--bottom-space">
                    <h2>WEEK 4 (AUG 31 - SEP 1)</h2>   
                    <div class="info_desc__list_wrapper">     
                        <ul class="info_desc__list">
                            <li>Single bracket</li>
                            <li>Matches are <strong>Best of 13</strong> with <strong>2 bans</strong> and <strong>1 protect</strong></li>
                            <li>Mappool size (20 maps): <strong>5 NM</strong><strong> / </strong><strong>4 HD</strong><strong> / </strong><strong>4 HR</strong><strong> / </strong><strong>4 DT</strong><strong> / </strong><strong>2 FM</strong><strong> / 1 TB</strong></li>
                        </ul>
                        <img 
                            class="info_desc__list_wrapper__image info_desc__list_wrapper__image--large"
                            src="../../Assets/img/site/open/info/w4.png"
                        >
                    </div>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    {{ $t('open.info.matchProcedures') }}
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>A referee will create a match at 10 minutes prior to match time</li>
                        <li>There are <strong>no warmups</strong></li>
                        <li>
                            Teams are <strong>expected</strong> to show up on time and prepared to matches
                            <ul class="info_desc__list">
                                <li>Captains are expected to <strong>be online</strong> at least 5 minutes <strong>before</strong> the scheduled match time to receive invites from referees</li>
                            </ul>
                        </li>
                        <li>Teams that fail to field a roster <strong>5 minutes</strong> after the scheduled match time shall <strong>forfeit</strong></li>
                        <li>There are<strong> no restrictions</strong> on picks or bans</li>
                        <li><strong>NF</strong> is enforced on all maps</li>
                        <li>Captains will roll in matches. The <strong>winner</strong> will <strong>pick first, ban second,</strong> and <strong>protect second</strong></li>
                        <li>
                            Teams have <strong>1 protected map</strong> each
                            <ul class="info_desc__list">
                                <li>Protected maps <strong>cannot</strong> be banned but can be picked by either team</li>
                            </ul>
                        </li>
                        <li>Teams have <strong>2 bans</strong> throughout bracket stage</li>
                        <li>
                            Each set of bans shall have teams banning <strong>1 map</strong>
                            <ul class="info_desc__list">
                                <li>The <strong>first set</strong> of bans shall be at the <strong>start</strong> of the match</li>
                                <li>The <strong>second set</strong> of bans shall be after <strong>4 maps</strong> are played</li>
                                <li>Ban order is <strong>ABAB</strong></li>
                            </ul>
                        </li>
                        <li>
                            Teams have <strong>90 seconds</strong> to declare <strong>picks, bans, and protects</strong>
                            <ul class="info_desc__list">
                                <li>
                                    If a team takes more time than allotted for any of the above actions, the procedures adopted will be as follows:
                                    <ul class="info_desc__list">
                                        <li><strong>First occurrence:</strong> A 15-second extension is given along with a verbal warning</li>
                                        <li><strong>On subsequent occurrences:</strong> A random map will be chosen from the mappool using !roll X, where X is the number of beatmaps remaining in the mappool</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                        <li>
                            Teams have <strong>90 seconds</strong> to swap teammates and <strong>lock in their roster</strong>
                            <ul class="info_desc__list">
                                <li>
                                    If a team takes more time than allotted for either action, the procedures adopted will be as follows:
                                    <ul class="info_desc__list">
                                        <li><strong>First occurrence:</strong> A 15-second extension is given along with a verbal warning</li>
                                        <li><strong>On subsequent occurrences:</strong> the referee will issue the !mp start 10 command</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                    <h2>FREEMOD RULES</h2>
                    <ul class="info_desc__list">
                        <li>
                            <strong>FreeMod Rules</strong>: Allowed mods are <strong>HD</strong> and <strong>HR</strong>. Each team must have <strong>at least</strong> one player with <strong>HD</strong> and one player with <strong>HR</strong> (or HDHR)
                            <ul class="info_desc__list">
                                <li><strong>Tiebreakers</strong> are played with <strong>FreeMod</strong> enabled, however, <strong>do not</strong> require players to use a mod</li>
                            </ul>
                        </li>
                    </ul>
                    <h2>DISCONNECTIONS</h2>
                    <ul class="info_desc__list">
                        <li>In the event of a <strong>disconnection</strong>, an abort/replay may be called if it occurred within the first <strong>30 seconds</strong> of the map. Other than that, common sense will be applied. If <strong>proof</strong> exists of the disconnected player's score (or a rough estimate of their hypothetical score if they finished the map), it will be used. If it is at all <strong>ambiguous</strong>, the player&rsquo;s score is considered <strong>forfeit</strong>.</li>
                        <li><strong>Disconnections</strong> are considered to be unexpected, game-breaking events <strong>out of a player&rsquo;s control</strong> (i.e. keyboard/tablet/mouse malfunction, system failure, internet disconnect, etc). Offset, background dim, leaderboard presence, etc. <strong>ARE NOT</strong> considered valid reasons to call for an abort/replay as players may fix these on their own time.</li>
                    </ul>
                    <ContentButton 
                        class="content_button--red info_report_button content_button--margin"
                        link="https://pif.ephemeral.ink/tournament-reports"
                        external
                    >
                        {{ $t('open.info.reportTournament') }}
                    </ContentButton>
                    <p><em>*{{ $t('open.info.subjectToChange') }}</em></p>
                </div>
            </div>
            <div 
                v-else-if="tournament && page === 'condensed'"
                class="info_main"
            >
                <div class="info_desc">
                    <div>
                        <img src="../../Assets/img/site/open/banner.png">
                    </div>
                    <hr class="line--gray line--no-fill">
                    <div class="info_desc__text">
                        {{ tournament.description }}
                    </div>
                    <hr class="line--gray line--no-fill">
                    <ContentButton 
                        class="content_button--red info_report_button content_button--margin"
                        link="https://pif.ephemeral.ink/tournament-reports"
                        external
                    >
                        {{ $t('open.info.reportTournament') }}
                    </ContentButton>
                    <div class="info_match">
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.matchSize') }}
                            </template>
                            {{ tournament.matchupSize }}v{{ tournament.matchupSize }}
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.minPlayers') }}
                            </template>
                            {{ tournament.minTeamSize }}
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.maxPlayers') }}
                            </template>
                            {{ tournament.maxTeamSize }}
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.pickTimer') }}
                            </template>
                            {{ tournament.mapTimer || 90 }} s
                        </MatchBox>
                        <MatchBox>
                            <template #title>
                                {{ $t('open.info.matchInfo.readyTimer') }}
                            </template>
                            {{ tournament.readyTimer || 90 }} s
                        </MatchBox>
                    </div>
                </div>
                <div 
                    class="info_stages"
                >
                    <div class="info_stage_selector">
                        <ContentButton 
                            v-for="stage in stageList"
                            :key="stage.ID"
                            :class="{ 'content_button--active': selectedStage === stage.ID }"
                            @click.native="selectedStage = stage.ID"
                        >
                            {{ $t(`open.stages.${stage.name.toLowerCase()}`) }}
                        </ContentButton>
                    </div>
                    <div
                        v-if="stage"
                        class="info_stage_panel"
                    >
                        <div class="info_stage_title">
                            {{ $t(`open.stages.${stage.name.toLowerCase()}`) }} 
                            <span class="info_stage_title--red">{{ $t(`open.stages.abbreviations.${stage.abbreviation.toLowerCase()}`) }}</span> 
                            <div class="info_stage_title__status">
                                <MatchStatus 
                                    class="status"
                                    :class="{ 'status--not_started': stageStatus === 'notStarted', 'status--ongoing': stageStatus === 'ongoing', 'status--completed': stageStatus === 'complete' }"
                                >
                                    {{ $t(`open.info.status.${stageStatus}`) }}
                                </MatchStatus>
                            </div>
                            <hr class="line--gray line--bottom-space-default">
                        </div>
                        <div class="info_stage_data">
                            <div class="info_stage_data__content">
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.order') }}
                                    </template>
                                    <template #value>
                                        {{ stage.order }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.scoringMethod') }}
                                    </template>
                                    <template #value>
                                        {{ scoringMethod }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.type') }}
                                    </template>
                                    <template #value>
                                        {{ stageType }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.initialSize') }}
                                    </template>
                                    <template #value>
                                        {{ stage.initialSize }}
                                    </template>
                                </InfoData>
                            </div>
                            <div class="line--vertical_gray" />
                            <div class="info_stage_data__content">
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.startDate') }}
                                    </template>
                                    <template #value>
                                        {{ stage.timespan.start.toUTCString() }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.endDate') }}
                                    </template>
                                    <template #value>
                                        {{ stage.timespan.end.toUTCString() }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.rounds') }}
                                    </template>
                                    <template #value>
                                        {{ stage.rounds.length ? `${stage.rounds.length} rounds` : "N/A" }}
                                    </template>
                                </InfoData>
                                <InfoData>
                                    <template #title>
                                        {{ $t('open.info.matchInfo.finalSize') }}
                                    </template>
                                    <template #value>
                                        {{ stage.finalSize }}
                                    </template>
                                </InfoData>
                            </div>
                        </div>
                    </div>
                    <div class="info_stage_panel">
                        <div class="info_stage_title">
                            {{ $t("open.info.headings.mappools") }}
                        </div>
                        <hr class="line--gray line--bottom-space-default">
                        <div class="info_stage_data--bottom_padding">
                            <div class="info_stage_data__content">
                                <div class="info_stage_data_mappools_selector">
                                    <ContentButton 
                                        v-for="mappool in stageMappoolsList"
                                        :key="mappool.ID"
                                        class="content_button--bottom_margin"
                                        :class="{ 'content_button--active': selectedMappool === mappool.ID }"
                                        @click.native="selectedMappool = mappool.ID"
                                    >
                                        {{ $t(`open.stages.${mappool.name.toLowerCase()}`) }}
                                    </ContentButton>
                                </div>
                            </div>
                            <div class="line--vertical_gray" />
                            <div 
                                v-if="mappool"
                                class="info_stage_data__mappool_data"
                            >
                                <div class="info_stage_data_text">
                                    <div class="info_stage_data_text__title">
                                        {{ $t(`open.stages.${mappool.name.toLowerCase()}`) }}
                                    </div>
                                    <div>
                                        <ul>
                                            <li
                                                v-for="slot in mappool.slots"
                                                :key="slot.ID"
                                            >
                                                {{ slot.name }} ({{ slot.acronym }}): {{ slot.maps.length }} maps
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="info_stage_data_button_group">
                                    <ContentButton
                                        :class="{ 
                                            'content_button--red': mappool.isPublic,
                                            'content_button--disabled': !mappool.isPublic,
                                        }"
                                        :link="`/mappool`"
                                        external
                                    >
                                        {{ mappool.isPublic ? $t('open.info.mappools.info') : $t('open.info.mappools.notAvailable') }}
                                    </ContentButton>
                                    <ContentButton
                                        :class="{ 
                                            'content_button--red': mappool.isPublic,
                                            'content_button--disabled': !mappool.isPublic,
                                        }"
                                        :link="mappool.isPublic ? mappool.mappackLink || '' : ''"
                                        external
                                    >
                                        {{ mappool.isPublic ? $t('open.info.mappools.mappackDownload') : $t('open.info.mappools.mappacknotAvailable') }}
                                    </ContentButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div 
                v-else
                class="info_main"
            >
                <div class="info_desc">
                    <div class="info_desc__text">
                        Could not find tournament
                    </div>
                </div>
                <div class="info_stages">
                    <div class="info_stage_selector" />
                    <div class="info_stage_panel" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { Tournament } from "../../Interfaces/tournament";
import { ScoringMethod, Stage, StageType } from "../../Interfaces/stage";
import { Mappool } from "../../Interfaces/mappool";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import MatchBox from "../../Assets/components/open/InfoMatchBox.vue";
import InfoData from "../../Assets/components/open/InfoData.vue";
import MatchStatus from "../../Assets/components/open/MatchStatus.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import SubHeader from "../../Assets/components/open/SubHeader.vue";

const openModule = namespace("open");

enum StageStatus {
    NOT_STARTED = "notStarted",
    ONGOING = "ongoing",
    COMPLETED = "complete",
}

@Component({
    components: {
        ContentButton,
        MatchBox,
        InfoData,
        MatchStatus,
        OpenTitle,
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
export default class Info extends Vue {

    @openModule.State tournament!: Tournament | null;

    selectedStage = 0;
    selectedMappool = 0;
    page: "info" | "condensed" = "info";

    get stageList (): {
        ID: number; 
        name: string; 
        order: number;
    }[] {
        const stages = this.tournament?.stages.map<{
            ID: number; 
            name: string; 
            order: number;
        }>(s => {
            return {
                ID: s.ID,
                name: s.name,
                order: s.order,
            };
        }) ?? [];

        return stages;
    }

    @Watch("stageList", { immediate: true })
    onstageListChanged (list: {ID: number; name: string}[]) {
        if (list.length > 0)
            this.selectedStage = list[0]?.ID || 0;
    }

    get stage (): Stage | null {
        return this.tournament?.stages.find(s => s.ID === this.selectedStage) ?? null;
    }

    get stageType () {
        if (this.stage)
            return StageType[this.stage.stageType];
        return "";
    }

    get scoringMethod () {
        if (this.stage)
            return ScoringMethod[this.stage.scoringMethod];
        return "";
    }

    @Watch("stage", { immediate: true })
    onStageChanged (stage: Stage | null) {
        if (stage)
            this.selectedMappool = stage.mappool[0]?.ID || 0;
    }

    get stageStatus (): StageStatus {
        if (!this.stage)
            return StageStatus.NOT_STARTED;

        if (this.stage.timespan.start.getTime() > Date.now())
            return StageStatus.NOT_STARTED;

        if (this.stage.timespan.end.getTime() < Date.now())
            return StageStatus.COMPLETED;

        return StageStatus.ONGOING;
    }

    get stageMappools (): Mappool[] {
        return this.stage?.mappool ?? [];
    }

    get stageMappoolsList (): {ID: number; name: string}[] {
        return this.stageMappools.map(m => {
            return {
                ID: m.ID,
                name: m.name,
            };
        });
    }

    get mappool (): Mappool | null {
        return this.stageMappools.find(m => m.ID === this.selectedMappool) ?? null;
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.info {
    width: 100%;

    &_wrapper {
        width: 75vw;
        align-self: center;
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    &_main {
        display: flex;
        flex-direction: row;
        align-items: stretch;
    }

    &_section {
        border: 1px solid #000;
        background: linear-gradient(180deg, #1B1B1B 0%, #333 100%);
        box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
        padding: 40px;
        flex-direction: column;

        &_header {
            width: 100%;
        }
    }

    /* left panel */
    &_desc {
        display: flex;
        flex-direction: column;
        width: 30%;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
        margin: 15px 20px 0 0;
        padding: 40px 35px;

        & img {
            width: 100%;
            object-fit: cover;
            overflow: hidden;
        }

        &_button {
            flex: 1;
        }

        &__images {
            display: flex;
            justify-content: space-between;

            & img {
                height: 500px;
            }
        }

        &__text {
            text-align: center;

            &--noAlign {
                text-align: left;
            }
        }

        &__buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }

        &__list {
            display: flex;
            flex-direction: column;
            margin: 0;

            & li strong {
                color: $open-red;
                font-weight: 600;
            }

            & li red {
                color: $open-red;
                font-weight: 800;
                font-style: italic;
            }

            &_wrapper {
                display: flex;
                flex-direction: row;
                width: 100%;
                justify-content: space-between;
                overflow: hidden;
                align-items: center;
                margin-bottom: 1em;

                &__image {
                    max-height: 300px;
                    object-fit: contain;
                    overflow: hidden;

                    &--small {
                        max-height: 200px;
                    }

                    &--medium {
                        max-height: 300px;
                    }

                    &--large {
                        max-height: 400px;
                    }

                }

                &--align-left {
                    justify-content: flex-start;
                }

                &--center {
                    align-items: center;
                    justify-content: flex-end;
                }
            }
        }
    }

    &_match {
        margin-top: -10px;
    }
        
    /*right panel */
    &_stages {
        display: flex;
        flex-direction: column;
        width: 70%;   
    }         

    &_stage_selector {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 10px;
    }

    &_stage_panel {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            padding: 15px;
        
        &--grow {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            padding: 15px;
        }
    }

     &_stage_title {
        position: relative;
        font-family: $font-commuterssans;
        font-size: $font-xxxl;

        &__status {
            position: absolute;
            top: 10px;
            right: 0;
        }

        &--red {
            color: $open-red;
            display: inline;
        }
    }

    &_stage_panel:last-child {
        margin-top: 30px;
    }

    &_stage_data {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        height: 100%;

        &--bottom_padding {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            height: 100%;
            padding-bottom: 20px;
        }

        &__mappool_data {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex-grow: 1;
            padding-left: 20px;
            padding-right: 0;
        }

        &__content {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            padding-right: 20px;
        }

        &__content:last-child {
            padding-left: 20px;
            padding-right: 0;
        }

        &_text {
            padding: 20px 50px 20px 50px;
            display: flex;
            flex-direction: column;
            font-size: $font-lg;

            &__title {
                font-family: $font-ggsans;
                font-weight: 800;
                color: #EBEBEB;
            }

            & ul {
                margin-left: 35px;
                list-style-type: none;
                font-family: $font-ggsans;
                font-weight: 600;
            }

            & ul li {
                position: relative;
            }

            & ul li::before {
                content: "";
                position: absolute;
                top: 50%;
                left: -25px;
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }
        &_mappools_selector {
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
        }

        &_button_group {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin: 0 0 0 -15px;        
        }
    }
}
</style>
