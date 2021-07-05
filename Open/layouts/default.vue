<template>
    <div class="app">
        <Header v-if="$route.path !== '/404' && !$route.path.includes('/streamer')" :registered="registered" :team="team" :user="user" :user-invitations="userInvitations" :discord-reg="discordReg" :in-team="inTeam" :no-notifications="noNotifications" @refresh="refresh" @team-registering="teamRegistering = true" :site="site"></Header>
        <router-view :key="$route.fullPath" :app="this" :registered="registered" :in-team="inTeam" :team="team" :user="user" :team-registering="teamRegistering" @team-registering="teamRegistering = !teamRegistering" @team-edited="refresh"></router-view>
    </div>
</template>

<script>
import axios from "axios";
import _ from "lodash";
import regeneratorRuntime from "regenerator-runtime";
import Header from "../components/header/Header";

export default {  

    components: {
        Header,
    },
    
    data: () => ({
        discordReg: false,
        inTeam: false,
        noNotifications: true,
        registered: false,
        team: {},
        teamRegistering: false,
        user: {},
        userInvitations: [],
        site: "open",
    }),
    created: function() {
        this.refresh();
    },
    head: () => {
      return {
        title: "Corsace Open",
        meta: [
            {   charset: 'utf-8'    },
            {   'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
            {   name: 'description', content: 'Corsace Open is one of the largest unofficial tournaments in the free-to-win rhythm game, osu!, where teams of 8 battle it out 4v4!'},
            {   name: 'viewport', content: 'width=device-width, initial-scale=1'    }
        ],
        link: [
            {   rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Poppins:100,300,700'  },
            {   rel: 'shortcut icon', type: 'image/png', href: '../../Assets/img/open/logo.png' }
        ]
      }
    }, 
    methods: {
        refresh: async function() {
            this.discordReg = false;
            this.inTeam = false;
            this.noNotifications = true;
            this.registered = false;
            this.team = {};
            this.teamRegistering = false;
            this.user = {};
            this.userInvitations = [];
            await this.refreshUser();
            await this.refreshTeam();
            await this.refreshPendingInvites();
        },
        refreshUser: async function() {
            const data = (await axios.get("/api/user")).data.user;
            if(data) {
                this.discordReg = true;
                this.user = data;
                if (this.user.osuLinked === true) {
                    this.registered = true;
                    this.user.pp = Math.round(this.user.pp);
                }
            }
        },
        refreshTeam: async function() {
            if(this.user.team) {
                const data = (await axios.get("/api/team")).data.team;
                if(data) {
                    this.team = data;
                    this.inTeam = true;
                    for (var i=0; i<this.team.members.length; i++) {
                        this.team.members[i].pp = Math.round(this.team.members[i].pp);
                    }
                    this.team.averagePp = Math.round(this.team.averagePp);
                }
            }
        },
        refreshPendingInvites: async function() {
            if(_.isEmpty(this.team) && this.registered && !this.user.isStaff) {
                const data = (await axios.get("/api/user/pendingInvites")).data.invites;
                if(data) {
                    this.userInvitations = data;
                    if (this.userInvitations.length !== 0) {
                        this.noNotifications = false;
                    }
                } 
            }
        },
    }
}
</script>

<style>
.app {
    display: grid;
}

body {
    margin: 0;
    background-image: url(../../Assets/img/open/bg.png);
    font-family: 'Poppins', sans-serif;
    color: white;
    line-height: 1;
    background-repeat: no-repeat;
    background-color: #070404;
}

@media only screen and (min-width: 1921px) {
    body {
        background-size: cover;
    }
}


</style>