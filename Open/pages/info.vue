<template>
    <div class="info">
        <div class="info__sub_header">
            <div
                class="info__sub_header_item"
                :class="{ 'info__sub_header_item--active': page === 'info' }"
                @click="page = 'info'"
            >
                {{ $t('open.info.title') }}
            </div>
            <div
                class="info__sub_header_item"
                :class="{ 'info__sub_header_item--active': page === 'condensed' }"
                @click="page = 'condensed'"
            >
                {{ $t('open.info.condensed') }}
            </div>
        </div>
        <div class="info_wrapper">
            <OpenTitle v-if="page === 'condensed'">
                {{ $t('open.info.title') }}
            </OpenTitle>
            <div
                v-if="tournament && page === 'info'"
                class="info_main info_section"
            >
                <div class="info_desc__text">
                    The 2023 edition of Corsace Open, one of osu!'s most prestigious unofficial 4v4 tournaments. Organized by Corsace, this open rank tournament gathers some of the most talented players from around the world, serving as a testament to the skill, strategy, and teamwork inherent in the rhythm game community.
                </div>
                <div class="info_desc__buttons">
                    <ContentButton 
                        class="content_button--red info_desc_button"
                        link="https://paypal.me/corsaceofficial"
                        external
                    >
                        DONATE TO CORSACE
                    </ContentButton>
                    <ContentButton 
                        class="content_button--red info_desc_button"
                        link="http://momokai.com/corsace"
                        external
                    >
                        SUPPORT VIA MOMOKAI SPONSORSHIP
                    </ContentButton>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    GENERAL INFORMATION
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>Corsace Open is a <strong>4v4</strong>, <strong>international</strong> tournament open to players of <strong>all ranks</strong></li>
                        <li>All matches are played using <strong>Team VS</strong>, <strong>ScoreV2</strong></li>
                        <li>All scheduling shall be done in <strong>UTC</strong></li>
                        <li>All matches must take place between <strong>Friday 23:59 UTC</strong> and<strong> Sunday 23:59 UTC</strong></li>
                        <li>Reschedules must be submitted before <strong>Thursdays at 23:59 UTC</strong> the week a round is to take place. Exceptions are made on a case-by-case basis</li>
                        <li>Staff are <strong>prohibited</strong> from playing and/or acting as managers in the tournament with the exception of<strong> streamers</strong>, <strong>commentators</strong>, and <strong>GFX artists</strong></li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    TEAM STRUCTURE
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>Teams may consist of <strong>6</strong> and <strong>only 6</strong> players </li>
                        <li>
                            Team names may consist of 3 - 20 characters with acronyms of 2 - 4 letters along with a team photo (A 3:1 image is preferred)
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
                    <h2>MANAGERS</h2>
                    <ul class="info_desc__list">
                        <li>
                            Teams are required to <strong>designate </strong>a manager, which may either be a player <strong>or</strong> an additional seventh member
                            <ul>
                                <li>Said additions are subject to screening and are <strong>prohibited</strong> from participating in gameplay</li>
                            </ul>
                        </li>
                        <li>Managers are the <strong>primary form of contact</strong> between teams and tournament administration alike</li>
                        <li>Managers are allowed to win non-badge prizes (i.e. supporter/money, the split is determined by the team</li>
                        <li>
                            <strong>Responsibilities:</strong>
                            <ul>
                                <li>
                                    Registration
                                    <ul>
                                        <li>Create and update team information</li>
                                    </ul>
                                </li>
                                <li>Reschedules</li>
                                <li>
                                    Match Presence
                                    <ul>
                                        <li>Rolls, picks, bans, and protects</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    QUALIFIERS PROCEDURES
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>Teams shall have their own lobby run by the Corsace bot</li>
                        <li>The deadline to play qualifiers to complete registration is <strong>July 30 at 23:59 UTC</strong></li>
                        <li>The mappool consists of <strong>10 maps</strong> (<strong>3 NM</strong><strong> / </strong><strong>2 HD</strong><strong> / </strong><strong>2 HR</strong><strong> / </strong><strong>3 DT</strong>) and shall be played <strong>ONCE</strong>, starting from NM1 and ending in DT3</li>
                        <li>90 second timers are used for teams to swap members and ready up</li>
                        <li>
                            Teams<strong> complete registration</strong> by playing qualifiers
                            <ul class="info_desc__list">
                                <li>Rosters are<strong> locked </strong>after play. Changes are <strong>not</strong> allowed</li>
                                <li>Due to this process, teams with players who are <strong>screened out</strong> will automatically be <strong>disqualified</strong></li>
                            </ul>
                        </li>
                        <li>Qualifier results are calculated using z-score</li>
                    </ul>
                    <h2>SEEDING</h2>
                    <ul class="info_desc__list">
                        <li><strong>24 teams </strong>qualify and are split into <strong>two tiers</strong></li>
                        <li>
                            <strong>Tier 1 </strong>(Seeds 1 - 8)
                            <ul class="info_desc__list">
                                <li>Becomes Teams 1 - 8 in KO1</li>
                                <li>Does not play Round Robin or Runoff</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Tier 2</strong> (Seeds 9 - 24)
                            <ul class="info_desc__list">
                                <li>Moves on to Round Robin placed into 4 groups of 4</li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    TOURNAMENT STRUCTURE
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>The tournament consists of <strong>4 stages</strong>: Round Robin (RR), Runoff (RO), Knockout 1 (KO1), and Knockout Stage 2 (KO2)</li>
                        <li>Knockout 1 and Knockout 2 are considered the <strong>main bracket</strong> in the tournament with Round Robin and Runoff being used to supplement the remaining teams.</li>
                    </ul>
                    <h2>ROUND ROBIN (AUG 12 - 13)</h2>
                    <ul class="info_desc__list">
                        <li>
                            <strong>Groups </strong>(16 teams, 24 matches)
                            <ul class="info_desc__list">
                                <li>Group A (Seeds 9, 16, 17, 24)</li>
                                <li>Group B (Seeds 10, 15, 18, 23)</li>
                                <li>Group C (Seeds 11, 14, 19, 22)</li>
                                <li>Group D (Seeds 12, 13, 20, 21)</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Placements:</strong>
                            <ul class="info_desc__list">
                                <li>Seeding is in the following precedence:</li>
                            </ul>
                        </li>
                    </ul>
                    <ul class="info_desc__list">
                        <li>Difference in Points (W/L Ratio)</li>
                        <li>Average score difference per map</li>
                        <li>
                            Average accuracy per map
                            <ul class="info_desc__list">
                                <li><strong>1st:</strong> Moves on to <strong>Knockout 1</strong> (becomes Teams 9 - 12 in KO1)</li>
                                <li><strong>2nd</strong> and <strong>3rd:</strong> Moves on to <strong>Runoff</strong></li>
                                <li><strong>4th:</strong> <black>ELIMINATED</black></li>
                            </ul>
                        </li>
                    </ul>
                    <ul class="info_desc__list">
                        <li>Matches are <strong>Best of 9</strong> with <strong>1 ban</strong></li>
                        <li>Mappool size (15 maps): <strong>5 NM</strong><strong> / </strong><strong>2 HD</strong><strong> / </strong><strong>2 HR</strong><strong> / </strong><strong>3 DT</strong><strong> / </strong><strong>2 FM</strong><strong> / 1 TB</strong></li>
                    </ul>
                    <h2> RUNOFF (AUG 19 - 20)</h2>
                    <ul class="info_desc__list">
                        <li>Consists of 2 rounds running similar to a traditional bracket</li>
                        <li>Used to determine Teams 13 - 16 in Knockout 1</li>
                        <li>
                            <strong>Round 1 </strong>(8 teams, 4 matches)
                            <ul class="info_desc__list">
                                <li>Winners move on to Round 2</li>
                                <li>Losers are <black>ELIMINATED</black></li>
                            </ul>
                        </li>
                        <li>
                            <strong>Round 2 </strong>(4 teams, 2 matches)
                            <ul class="info_desc__list">
                                <li>Winners become Teams 13/14 in Knockout 1</li>
                                <li>Losers become Teams 15/16 in Knockout 1</li>
                            </ul>
                        </li>
                        <li>Matches are <strong>Best of 11</strong> with <strong>2 bans</strong></li>
                        <li>Mappool size (15 maps): <strong>5 NM</strong><strong> / </strong><strong>2 HD</strong><strong> / </strong><strong>2 HR</strong><strong> / </strong><strong>3 DT</strong><strong> / </strong><strong>2 FM</strong><strong> / 1 TB</strong></li>
                    </ul>
                    <h2>KNOCKOUT 1 (AUG 26 - 27)</h2>
                    <ul class="info_desc__list">
                        <li>
                            Single-elimination bracket
                            <ul class="info_desc__list">
                                <li>Consists of Round of 16 and Quarterfinals <strong>only</strong></li>
                            </ul>
                        </li>
                        <li>Matchups are determined using <strong>power seeding</strong> (#1 vs #16, #2 vs #15, etc.)</li>
                        <li>Teams 9 - 12 are seeded using the same order of precedence used in RO</li>
                        <li>Matches are <strong>Best of 3 Sets</strong></li>
                        <li>Sets are <strong>Best of 7</strong> with <strong>1 protect </strong>and <strong>1 ban</strong></li>
                        <li>
                            Mappool size (31 maps):
                            <ul class="info_desc__list">
                                <li>
                                    3 total mappools
                                    <ul class="info_desc__list">
                                        <li>Each mappool consists of 10 maps: <strong>4 NM</strong><strong> / </strong><strong>2 HD</strong><strong> / </strong><strong>2 HR</strong><strong> / </strong><strong>2 DT</strong></li>
                                    </ul>
                                </li>
                                <li>1 TB is used for the entire stage</li>
                            </ul>
                        </li>
                    </ul>
                    <h2>KNOCKOUT 2 (SEP 2 - 3)</h2>
                    <ul class="info_desc__list">
                        <li>
                            Single-elimination bracket (cont.)
                            <ul class="info_desc__list">
                                <li>Consists of Semifinals, Finals, and a match for 3rd place</li>
                            </ul>
                        </li>
                        <li>Matches are <strong>Best of 13</strong> with <strong>1 protect</strong> and <strong>2 bans</strong></li>
                        <li>Mappool size (18 maps): <strong>5 NM</strong><strong> / </strong><strong>2 HD</strong><strong> / </strong><strong>2 HR</strong><strong> / </strong><strong>4 DT</strong><strong> / </strong><strong>4 FM</strong><strong> / 1 TB</strong></li>
                    </ul>
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    INFOGRAPHIC
                </OpenTitle>
                <div class="info_desc__images">
                    <img src="../../Assets/img/site/open/info/image1.png">
                    <img src="../../Assets/img/site/open/info/image2.png">
                </div>
                <OpenTitle
                    class="info_section_header"
                >
                    MATCH PROCEDURES
                </OpenTitle>
                <div class="info_desc__text info_desc__text--noAlign">
                    <ul class="info_desc__list">
                        <li>A referee will create a match at 10 minutes prior to match time</li>
                        <li>There are <strong>no warmups</strong></li>
                        <li>
                            Teams are <strong>expected</strong> to show up on time and prepared to matches
                            <ul class="info_desc__list">
                                <li>Managers are expected to <strong>be online</strong> at least 5 minutes <strong>before</strong> the scheduled match time to receive invites from referees</li>
                            </ul>
                        </li>
                        <li>Teams that fail to field a roster <strong>5 minutes</strong> after the scheduled match time shall <strong>forfeit</strong>.</li>
                    </ul>
                    <ul class="info_desc__list">
                        <li>There are<strong> no restrictions</strong> on picks or bans</li>
                        <li><strong>NF</strong> is enforced on all maps</li>
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
                    <h2>ROUND ROBIN/RUNOFF/KNOCKOUT 2</h2>
                    <ul class="info_desc__list">
                        <li>Managers will roll in matches. The <strong>winner</strong> becomes <strong>Team 1</strong> which <strong>picks first, bans second, </strong>and, in Knockout 2, <strong>protects second</strong></li>
                        <li>
                            Teams have <strong>1 protected map</strong> during Knockout 2
                            <ul class="info_desc__list">
                                <li>Protected maps <strong>cannot</strong> be banned but can be picked by either team</li>
                            </ul>
                        </li>
                        <li>Teams have<strong> 1 ban </strong>during <strong>Round Robin</strong>, <strong>2 bans</strong> during <strong>Runoff</strong> and <strong>Knockout 2</strong></li>
                        <li>
                            Each set of bans shall have teams banning <strong>1 map</strong>
                            <ul class="info_desc__list">
                                <li>The <strong>first set</strong> of bans shall be at the <strong>start</strong> of the match</li>
                                <li>
                                    The<strong> second set of bans</strong> shall be after <strong>4 maps</strong> are played
                                    <ul class="info_desc__list">
                                        <li>The<strong> losing</strong> team shall <strong>ban first</strong> (EX: If the scoreline is 4 - 0, the team with 0 points bans first)</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                    <h2>KNOCKOUT 1</h2>
                    <ul class="info_desc__list">
                        <li>Managers will roll in matches. The <strong>winner</strong> becomes <strong>Team 1</strong> which <strong>picks first, bans second, </strong>and <strong>protects second</strong></li>
                        <li><strong>Matches</strong> are Best of 3 Sets whereas a  <strong>Set</strong> is a Best of 7 with 1 ban</li>
                        <li>
                            Pool selection for sets goes as follows:
                            <ul class="info_desc__list">
                                <li>
                                    The <strong>first set</strong> will have both teams DM the referee with the pool that they&rsquo;d like to strike
                                    <ul class="info_desc__list">
                                        <li>This process <strong>decides</strong> the first pool to be played</li>
                                        <li>If teams strike <strong>different pools</strong>, the remaining mappool shall be played</li>
                                        <li>If teams strike the <strong>same pool</strong>, the<strong> lower-seeded team</strong> will choose the pool to play from the two remaining mappools</li>
                                    </ul>
                                </li>
                                <li>The <strong>second set</strong> will have the<strong> losing team</strong> choose from the two remaining mappools</li>
                                <li>The <strong>third set</strong> will use the remaining pool</li>
                            </ul>
                        </li>
                        <li>
                            Teams have <strong>1 protected map</strong>
                            <ul class="info_desc__list">
                                <li>Protected maps <strong>cannot</strong> be banned but can be picked by either team</li>
                            </ul>
                        </li>
                        <li>Teams have <strong>1 ban</strong> that is declared after protects</li>
                    </ul>
                    <ContentButton 
                        class="content_button--red info_report_button"
                        link="https://pif.ephemeral.ink/tournament-reports"
                        external
                    >
                        REPORT TOURNAMENTS HERE
                    </ContentButton>
                    <p><em>*all rules are subject to change for clarification and/or adjustments</em></p>
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
                        class="content_button--red info_report_button"
                        link="https://pif.ephemeral.ink/tournament-reports"
                        external
                    >
                        REPORT TOURNAMENTS HERE
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
                            class="content_button--right_margin"
                            :class="{ 'content_button--active': selectedStage === stage.ID }"
                            @click.native="selectedStage = stage.ID"
                        >
                            {{ stage.name.toUpperCase() }}
                        </ContentButton>
                    </div>
                    <div
                        v-if="stage"
                        class="info_stage_panel"
                    >
                        <div class="info_stage_title">
                            {{ stage.name.toUpperCase() }} 
                            <span class="info_stage_title--red">({{ stage.abbreviation.toUpperCase() }})</span> 
                            <div class="info_stage_title__status">
                                <MatchStatus 
                                    class="status"
                                    :class="{ 'status--not_started': stageStatus === 'NOT STARTED', 'status--ongoing': stageStatus === 'ONGOING', 'status--completed': stageStatus === 'COMPLETED' }"
                                >
                                    {{ stageStatus }}
                                </MatchStatus>
                            </div>
                            <hr class="line--gray line--bottom-space-default">
                        </div>
                        <div class="info_stage_data">
                            <div class="info_stage_data__content">
                                <InfoData>
                                    <template #title>
                                        ORDER
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
                            MAPPOOLS 
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
                                        {{ mappool.name.toUpperCase() }}
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
                                        {{ mappool.name.toUpperCase() }}
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
                                        class="content_button--right_margin_bottom"
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
                                        class="content_button--right_margin_bottom"
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

const openModule = namespace("open");

enum StageStatus {
    NOT_STARTED = "NOT STARTED",
    ONGOING = "ONGOING",
    COMPLETED = "COMPLETED",
}

@Component({
    components: {
        ContentButton,
        MatchBox,
        InfoData,
        MatchStatus,
        OpenTitle,
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
        }) || [];

        return stages;
    }

    @Watch("stageList", { immediate: true })
    onstageListChanged (list: {ID: number; name: string}[]) {
        if (list.length > 0)
            this.selectedStage = list[0]?.ID || 0;
    }

    get stage (): Stage | null {
        return this.tournament?.stages.find(s => s.ID === this.selectedStage) || null;
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
        return this.stage?.mappool || [];
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
        return this.stageMappools.find(m => m.ID === this.selectedMappool) || null;
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.info {
    width: 100%;

    &__sub_header {
        display: flex;
        justify-content: center;
        width: 100%;
        top: 0px;
        background-color: $open-red;
        color: $open-dark;

        &_item {
            position: relative;
            display: flex;
            justify-content: center;

            cursor: pointer;
            width: auto;
            text-decoration: none;
            font-weight: 700;
            padding: 5px 90px;

            &:hover, &--active {
                color: $white;
            }

            &--active::after {
                content: "";
                position: absolute;
                top: calc(50% - 4.5px/2);
                right: calc(100% - 4.5em);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $white;
            }
        }
    }

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


                & li strong {
                    color: $open-red;
                    font-weight: 600;
                }

                & li black {
                    color: black;
                    font-weight: 800;
                    font-style: italic;
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
        margin: 0 0 10px -10px;
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
