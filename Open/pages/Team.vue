<template>
    <div>
        <div class="teamPage" v-if="!$route.params.name && !loading">
            <div class="teamPageBody" v-if="inTeam">
                <div class="teamPageHeader">
                    <div>
                        <div v-if="edit" @mouseover="active = true" @mouseleave="active = false" class="uploadPic">
                            <input type="file" id="uploadPic" @change="addAvatar">
                            <label for="uploadPic"><img src="../../Assets/img/open/upload.png"></label>
                            <div class="osuPopup editPopup" v-if="active">5MB Max</div>
                        </div>
                        <img v-if="edit" :src="image64" class="teamPageLogo">
                        <img v-if="team.teamAvatarUrl === null && !edit" src="../../Assets/img/open/defaultTeamAvatar.png" class="teamPageLogo">
                        <img v-if="team.teamAvatarUrl !== null && !edit" v-bind:src="team.teamAvatarUrl" class="teamPageLogo">
                    </div>
                    <div class="teamPageHeaderInfo">
                        <input v-if="edit" v-model="teamRename" class="teamPageTitle nameEdit" @keydown.enter="editSave">
                        <div v-else class="teamPageTitle">{{ team.name }}</div>
                        <div class="teamPageHeaderRelevant">
                            <div class="teamPageSeed">
                                <div :class="`team${team.seed ? team.seed : 'Un'}SeedText`">{{ team.seed ? `RANK ${team.rank}` : 'UNRANKED' }}</div>
                            </div>
                            <div class="teamEdit" v-if="!edit && user.id === team.captain" @click="editMode">
                                <img src="../../Assets/img/open/edit.png">
                                {{ $t('teams.team.edit') }}
                            </div>
                            <div class="teamSave" v-if="edit && user.id === team.captain" @click="editSave">
                                <img src="../../Assets/img/open/editSave.png">
                                {{ $t('teams.team.save') }}
                            </div>
                        </div>
                    </div>
                    <div class="trashCan">
                        <img v-if="edit" @click="deleteTeam" src="../../Assets/img/open/delete.png">
                    </div>
                </div>
                <div class="teamPageInfo">
                    <div v-for="index in 8" :key="index">
                        <PlayerAccepted v-if="team.members[index-1]" :member="team.members[index-1]" :team="team" :user="user" :edit="edit" @update="app.refreshTeam" @transfer="edit=false" @alert="alert"></PlayerAccepted>
                        <PlayerInvited v-else-if="!team.members[index-1] && invitations[index-team.members.length-1]" :invite="invitations[index-team.members.length-1]" :team="team" :user="user" :edit="edit" @cancelled="updateInvitations"></PlayerInvited>
                        <PlayerInvite v-else-if="!team.members[index-1] && !invitations[index-team.members.length-1] && user.id === team.captain" @invited="updateInvitations" ></PlayerInvite>
                        <div v-else class="teamPagePlayer"></div>
                    </div>
                    <div class="teamPageStats">
                        <div class="teamPageStat">
                            <div class="teamPageNumbers">{{ Math.round(team.averageBWS) }}</div>
                            <div class="teamPageDesc">{{ $t('teams.team.ppAvg') }}</div>
                        </div>
                        <div class="teamPageStat">
                            <div v-if="team.rank !== null" class="teamPageNumbers">{{ team.rank }}</div>
                            <div v-else class="teamPageNumbers">--</div>
                            <div class="teamPageDesc">{{ $t('teams.team.rank') }}</div>
                        </div>
                        <router-link to="/qualifiers" class="teamPageStat">
                            <div v-if="team.qualifier" class="teamPageNumbers">
                                SEP {{team.qualifier.split('-')[2].split('T')[0]}}
                                <br>
                                {{team.qualifier.split('T')[1].slice(0,5)}} UTC
                            </div>
                            <div v-else class="teamPageNumbers">--</div>
                            <div class="teamPageDesc">{{ $t('header.qualifiers') }}</div>
                        </router-link>
                    </div>
                </div>
            </div>
            <div class="teamPageBody" v-if="!inTeam && registered">
                <div class="teamPageHeader createTeamHeader">
                    <div>
                        <div @mouseover="active = true" @mouseleave="active = false" class="uploadPic">
                            <input type="file" id="uploadPic" @change="addAvatar">
                            <label for="uploadPic"><img src="../../Assets/img/open/upload.png"></label>
                            <div class="osuPopup editPopup" v-if="active">5MB Max</div>
                        </div>
                        <img :src="image64" class="teamPageLogo">
                    </div>
                    <div class="teamPageHeaderInfo">
                        <input v-model="teamName" class="teamPageTitle nameEdit" @keydown.enter="createTeam" placeholder="ENTER TEAM NAME">
                        <div class="teamPageHeaderRelevant">
                            <div class="teamSave" @click="createTeam">
                                <img src="../../Assets/img/open/editSave.png">
                                {{ $t('teams.team.save') }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="teamPageInfo">
                    <div class="teamPagePlayer">
                        <div class="captainIcons">
                            <img class="captain" src="../../Assets/img/open/captain.png">
                        </div>
                        <a :href="'https://osu.ppy.sh/u/' + user.username"><div class="teamPagePlayerName">{{ user.username }}</div></a>
                        <div class="teamPagePlayerPP">
                            <div class="teamPageNumbers">{{ Math.round(Math.pow(user.rank, Math.pow(0.9937, Math.pow(user.badges, 2)))) }}</div>
                            <div class="teamPageDesc">{{ $t('teams.team.pp') }}</div>
                        </div>
                    </div>
                    <div v-for="index in 8" :key="index">
                        <div class="teamPagePlayer"></div>
                    </div>
                    <div class="teamPageStats">
                        <div class="teamPageStat">
                            <div class="teamPageNumbers">{{ team.averageBWS }}</div>
                            <div class="teamPageDesc">{{ $t('teams.team.ppAvg') }}</div>
                        </div>
                        <div class="teamPageStat">
                            <div class="teamPageNumbers">{{ team.rank }}</div>
                            <div class="teamPageDesc">{{ $t('teams.team.rank') }}</div>
                        </div>
                        <router-link to="/qualifiers" class="teamPageStat">
                            <div v-if="team.qualifier" class="teamPageNumbers">
                                SEP {{team.qualifier.split('-')[2].split('T')[0]}}
                                <br>
                                {{team.qualifier.split('T')[1].slice(0,5)}} UTC
                            </div>
                            <div v-else class="teamPageNumbers">--</div>
                            <div class="teamPageDesc">{{ $t('header.qualifiers') }}</div>
                        </router-link>
                    </div>
                </div>
            </div>
            <div class="teamPageBody" v-if="!registered">
                <div class="teamPageHeader noTeam">
                    <div class="teamPageTitle"><a href="/api/auth/discord">REGISTER ON THE WEBSITE!</a></div>
                </div>
            </div>
        </div>
        <div class="teamPage" v-else-if="!loading">
            <div class="teamPageBody">
                <div class="teamPageHeader">
                    <img v-if="otherTeam.teamAvatarUrl === null" src="../../Assets/img/open/defaultTeamAvatar.png" class="teamPageLogo">
                    <img v-if="otherTeam.teamAvatarUrl !== null" v-bind:src="otherTeam.teamAvatarUrl" class="teamPageLogo">
                    <div class="teamPageHeaderInfo">
                        <div class="teamPageTitle">{{ otherTeam.name }}</div>
                        <div class="teamPageHeaderRelevant">
                            <div class="teamPageSeed">
                                <div :class="`team${otherTeam.seed ? otherTeam.seed : 'Un'}SeedText`">{{ otherTeam.seed ? `RANK ${otherTeam.rank}` : 'UNRANKED' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="trashCan">
                        <img v-if="user.isHeadStaff" @click="deleteTeam" src="../../Assets/img/open/delete.png">
                    </div>
                </div>
                <div class="teamPageInfo">
                    <div v-for="index in 8" :key="index">
                        <PlayerAccepted v-if="otherTeam.members[index-1]" :member="otherTeam.members[index-1]" :team="otherTeam" :user="user" @kicked="app.refreshTeam"></PlayerAccepted>
                        <div class="teamPagePlayer" v-if="!otherTeam.members[index-1]">
                        </div>
                    </div>
                    <div class="teamPageStats">
                        <div class="teamPageStat">
                            <div class="teamPageNumbers">{{ Math.round(otherTeam.averageBWS) }}</div>
                            <div class="teamPageDesc">{{ $t('teams.team.ppAvg') }}</div>
                        </div>
                        <div class="teamPageStat">
                            <div v-if="otherTeam.rank !== null" class="teamPageNumbers">{{ otherTeam.rank }}</div>
                            <div v-else class="teamPageNumbers">--</div>
                            <div class="teamPageDesc">{{ $t('teams.team.rank') }}</div>
                        </div>
                        <router-link to="/qualifiers" class="teamPageStat">
                            <div class="teamPageNumbers" v-if="otherTeam.qualifier">
                                SEP {{otherTeam.qualifier.split('-')[2].split('T')[0]}}
                                <br>
                                {{otherTeam.qualifier.split('T')[1].slice(0,5)}} UTC
                            </div>
                            <div v-else class="teamPageNumbers">--</div>
                            <div class="teamPageDesc">{{ $t('header.qualifiers') }}</div>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="loading">
            <loading></loading>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import App from "../layouts/default.vue";
import Loading from "../components/Loading";
import PlayerInvite from "../components/team/PlayerInvite";
import PlayerInvited from "../components/team/PlayerInvited";
import PlayerAccepted from "../components/team/PlayerAccepted";
import regeneratorRuntime from "regenerator-runtime";

export default {
    components: {
        PlayerInvite,
        PlayerInvited,
        PlayerAccepted,
        Loading,
    },
    data: () => ({
        apply: false,
        active: false,
        edit: false,
        loading: false,
        teamName: "",
        teamRename: "",
        invitations: [],
        otherTeam: {},
        image: null,
        image64: "",
        regex: /^[a-zA-Z0-9\-\.\_\~\s]{3,20}$/,
    }),
    props: {
        app: App,
        inTeam: Boolean,
        registered: Boolean,
        team: Object,
        teamRegistering: Boolean,
        user: Object,
    },
    mounted: async function() {
        this.loading = true;
        if (this.$route.params.name) {
            if (this.team && this.$route.params.name === this.team.slug)
                this.$router.push({ path: '/team' });
            else {
                try {
                    this.otherTeam = (await axios.get('/api/team?teamSlug=' + this.$route.params.name)).data.team;
                } catch (e) {
                    this.$router.push({ path: '/404' });
                } finally {
                    this.loading = false;
                }
            }
        } else if (this.team.id || (await axios.get("/api/team")).team) {
            this.teamRename = this.team.name;
            this.image64 = this.team.teamAvatarUrl ?? "";
            this.updateInvitations();
        }
        this.loading = false;
    },
    methods: {
        teamRegisteringToggle: function() {
            this.$emit('team-registering');
        },
        createTeam: function() {
            if (this.regex.test(this.teamName) === false)
                alert(this.$i18n.messages[this.$i18n.locale].teams.team.teamnameLength + " Allowed characters: a-z, A-Z, 0-9, -, ., _, ~")
            else if (confirm("Please make sure your team name is not vulgar, or else you may possibly be banned from creating or joining teams on the site! If your team name is not vulgar then please press OK.")) {
                axios.get('/api/team/create?name=' + this.teamName).then(result => {
                    if (this.image !== null) {
                        this.uploadAvatar();
                        this.$emit('team-edited')
                    }
                    else {
                        this.$emit('team-edited')
                    }
                }, err => {
                    if(err.response.data.error === "TOO_MANY_GUILDS")
                        alert("Joining our Discord server is mandatory, and you have reached the maximum amount of Discord servers on your account. Please leave one and try again!");
                    else if (err.response.data.error === "BANNED")
                        alert(err.response.data.error + " Fuck off. If this may have been a mistake then contact VINXIS#1000 on discord.")
                    else
                        alert(err.response.data.error + " Try joining the discord server first, and then try again. Contact ThePooN or VINXIS if you still can't create a team.");
                });
            }
        },
        alert: function() {
            this.$emit('team-edited');
        },
        updateInvitations: function() {
            axios.get('/api/team/pendingInvitations').then(result => {
                this.invitations = result.data.invitations
                this.loading = false;
            }).catch(err => alert(err));
        },
        editMode: function() {
            this.edit = !this.edit;
        },
        editSave: function() {
            this.teamRename = this.teamRename.trim()
            if (this.image !== null) {
                this.uploadAvatar();
            }
            if (this.teamRename !== this.team.name) {
                this.rename();
            }
            this.$emit('team-edited');
            this.edit = false;
        },
        addAvatar: function(e) {
            var files = e.target.files || e.dataTransfer.files;
            if (!files.length)
                return;
            this.image = e.target.files[0];

            var reader = new FileReader();
            reader.onload = (e) => {
                this.image64 = e.target.result;
            }
            reader.readAsDataURL(this.image);
        },
        uploadAvatar: function() {
            const formData = new FormData()
            formData.append('avatar', this.image, this.image.name)
            axios.post('/api/team/uploadAvatar', formData).then(() => {
            }).catch((error) => {
                alert(error);
            });
        },
        rename: function() {
            if (this.regex.test(this.teamRename) === false) {
                alert(this.$i18n.messages[this.$i18n.locale].teams.team.teamnameLength  + " Allowed characters: a-z, A-Z, 0-9, -, ., _, ~")
            }
            else {
                axios.get('/api/team/rename?name=' + this.teamRename).catch(err => alert(err.response.data.error));
            }
        },
        deleteTeam: function() {
            if(confirm(this.$i18n.messages[this.$i18n.locale].teams.team.deleteTeam)) {
                if (this.team && !this.$route.params.name)
                    axios.get('/api/team/destroy').then(() => {
                        this.$emit('team-edited')
                        this.$router.push({ path: '/teams' });
                    }).catch(err => alert(err));
                else if (this.otherTeam && this.user.isHeadStaff)
                    axios.get('/api/team/ban?id=' + this.otherTeam.id).then(() => {
                        this.$emit('team-edited')
                        this.$router.push({ path: '/teams' });
                    }).catch(err => alert(err));
            }
        }
    }
}
</script>

<style>
.teamPage {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    margin-top: 40px;
    white-space: nowrap;
}

.teamPageBody {
    grid-column: 2;
    display: grid;
    grid-row-gap: 20px;
    background-image: url(../../Assets/img/open/textbg.png);
    padding: 72px 80px;
}

.teamPageHeader {
    display: grid;
    grid-template-columns: 1fr 6fr 1fr;
    grid-column-gap: 20px;
}

.uploadPic {
    position: absolute;
    background-color: rgba(0,0,0,0.5);
    height: 100px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#uploadPic {
    width: 0;
	height: 0;
	opacity: 0;
	overflow: hidden;
	position: absolute;
	z-index: -1;
}

.editPopup {
    width: 100px;
    left: 80%;
    border-radius: 0;
}

.teamPageLogo {
    height: 100px;
    width: 100px;
    align-self: end;
}

.teamPageHeaderInfo {
    display: grid;
    grid-row-gap: 10px;
}

.teamPageTitle {
    font-size: 60px;
    text-shadow: 3.5px 3.5px 5px rgba(24, 7, 0, 0.75);
    font-weight: bold;
    background: none;
    border: 0;
    color: white;
}

.nameEdit {
    font-family: 'Poppins', sans-serif;
    font-style: italic;
    padding: 0;
    height: 60px;
    width: 100%;
}

.teamPageHeaderRelevant {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr 2fr;
    grid-column-gap: 12px;
    grid-row: 2;
}

.teamPageSeed div {
    margin: 0;
}

.teamASeedText, .teamBSeedText, .teamCSeedText, .teamDSeedText, .teamUnSeedText, .createTeam {
    font-size: 16px;
    letter-spacing: 1.6px;
    padding: 7px 9px;
    border: solid;
    border-radius: 14px;
    margin-bottom: 20px;
    text-align: center;
}

.teamASeedText {
    color: #fff17e;
    text-shadow: 0 0 10px rgba(255,241,126,.75);
    box-shadow: 0 0 10px rgba(255,241,126,.75);
}

.teamBSeedText {
    color: #96ff7e;
    text-shadow: 0 0 10px rgba(150,255,126,.75);
    box-shadow: 0 0 10px rgba(150,255,126,.75);
}

.teamCSeedText {
    color: #67fdff;
    text-shadow: 0 0 10px rgba(103,253,255,.75);
    box-shadow: 0 0 10px rgba(103,253,255,.75);
}

.teamDSeedText {
    color: #be7eff;
    text-shadow: 0 0 10px rgba(190,126,255,.75);
    box-shadow: 0 0 10px rgba(190,126,255,.75);
}

.teamUnSeedText {
    color:#ff7d6d;
    text-shadow: 0 0 10px rgba(255,125,109,.75);
    box-shadow: 0 0 10px rgba(255,125,109,.75);
}

.teamUnverified {
    display: grid;
    grid-auto-flow: column;
    grid-column-gap: 3px;
    align-items: center;
}

.teamVerifiedText, .teamUnverifiedText {
    font-size: 16px;
    letter-spacing: 1.6px;
    padding: 7px 9px;
    border: solid;
    border-radius: 14px;
}

.teamVerifiedText {
    color: #0090ff;
    text-shadow: 0 0 10px rgba(0,144,255,.75);
    box-shadow: 0 0 10px rgba(0,144,255,.75);
}

.teamUnverifiedText {
    color: #707070;
    text-shadow: 0 0 10px rgba(112,112,112,.75);
    box-shadow: 0 0 10px rgba(112,112,112,.75);
}

.teamUnverifiedTextQ {
    cursor: pointer;
}

.teamEdit, .teamSave {
    display: flex;
    align-items: center;
    font-size: 24px;
    margin-right: 270px;
    width: 201px;
    cursor: pointer;
}

.teamEdit img, .teamSave img {
    padding-right: 3px;
}

.teamEdit {
    color: #494949;
}

.teamSave {
    color: #2fc45c;
}

.trashCan {
    display: flex;
    align-items: center;
}

.trashCan img {
    cursor: pointer;
}

.teamPageInfo {
    display: grid;
    grid-template-columns: repeat(5, minmax(162px,1fr));
    grid-template-rows: repeat(2, 1fr);
    grid-gap: 20px;
    grid-column: 1/3;
}

.teamPagePlayer {
    background-color: #111;
    display: grid;
    justify-items: center;
    align-items: end;
    height: 100%;
    position: relative;
}

.captainIcons {
    position: absolute;
    right: 0;
    top: 0;
    display: flex;
    flex-direction: column;
}

.captain, .notCaptain {
    position: static;
    justify-self: right;
    padding: 6px 6px 0;
}

.notCaptain {
    cursor: pointer;
}

.teamPagePlayerName {
    font-size: 16px;
    color: #c8cfd5;
    text-shadow: 0 0 10px rgba(200,207,213,.75);
    padding: 14px;
}

.teamPagePlayerPP, .teamPagePlayerDemerits {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 20px;
    grid-row-start: 2;
    grid-column-start: 1;
}

.teamPagePlayerDemerits {
    position: relative;
}

.teamPageNumbers {
    text-align: center;
    font-size: 30px;
    color: #866662;
    text-shadow: 0 0 10px rgba(134,102,98,.75);
}

.teamPageDesc {
    font-size: 10px;
    font-weight: bold;
    color: #866662;
    text-shadow: 0 0 10px rgba(134,102,98,.75);
    white-space: pre-line;
    text-align: center;
}

.teamPagePlayerPending {
    font-size: 16px;
    font-weight: bold;
    color: #c4802f;
    text-shadow: 0 0 10px rgba(196,128,47,.75);
    text-align: center;
    padding-bottom: 10px;
}

.teamPagePlayerInput {
    border: 0;
    outline: 0;
    color: #c8cfd5;
    background-color: #202020;
    font-family: inherit;
    font-size: 12px;
    text-decoration: none;
    text-align: center;
    font-style: italic;
    height: 30px;
    width: 100px;
    padding: 3px;
    align-self: end;
}

.osuPopupWrapper {
    position: relative;
    height: 0;
    justify-self: start;
}

.osuPopupAdd {
    position: absolute;
    width: 141.52px;
    background-color: #101010;
    text-align: center;
    border-radius: 0 0 10px 10px;
    padding: 8px;
    font-size: 10px;
    top: 56%;
    font-style: italic;
    white-space: normal;
}

.teamPagePlayerInvite {
    color: #2fc45c;
    cursor: pointer;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    text-shadow: 0 0 10px rgba(47,196,92,.75);
    margin-bottom: 10px;
    align-self: end;
}

.teamPageStats {
    background-color: #111;
    grid-column: 5;
    grid-row: 1/3;
    display: grid;
}

.teamPageStat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.noTeam {
    grid-template-columns: 1fr;
    grid-row-gap: 25px;
    text-align: center;
}

.noTeam  .teamPageTitle{
    cursor: pointer;
}

.createTeamHeader {
    grid-template-columns: 1fr 8fr 1fr;
}
</style>
