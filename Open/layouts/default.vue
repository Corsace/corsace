<template>
    <div class="app">
        <Header />
        <nuxt />
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import { Vue, Component } from "vue-property-decorator";
import { UserOpenInfo } from "../../Interfaces/user";
import { TeamInfo } from "../../Interfaces/team";
import { Invitation } from "../../Interfaces/invitation";
import {State, Action } from "vuex-class";
import _ from "lodash";
import regeneratorRuntime from "regenerator-runtime";
import Header from "../components/header/Header.vue";

@Component({
    components: {
        Header,
    },
    name: 'default',
    head () {
        return {
            title: "Corsace",
            metaInfo: [
                {   charset: 'utf-8'    },
                {   'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
                {   name: 'description', content: 'Corsace Open is one of the largest unofficial tournaments in the free-to-win rhythm game, osu!, where teams of 8 battle it out 4v4!'},
                {   name: 'viewport', content: 'width=device-width, initial-scale=1'    }
            ],
            link: [
                {   rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Poppins:100,300,700'  },
                {   rel: 'shortcut icon', type: 'image/png', href: '../../Assets/img/open/logo.png' }
            ]
        };
    },
})


export default class Default extends Vue {


    async mounted () {
        await this.$store.dispatch("refresh");

        await this.$store.dispatch("setInitialData");
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
        background-size: 100vw;
    }
}


</style>