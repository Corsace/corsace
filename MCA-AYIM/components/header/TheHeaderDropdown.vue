<template>
    <div 
        class="dropdown"
        @click="$emit('close')"
    >
        <nuxt-link
            v-if="site === 'ayim'"
            :to="`/${$route.params.year}/profile`"
        >
            PROFILE
        </nuxt-link>
        <a 
            v-if="!loggedInUser.discord || !loggedInUser.discord.userID"
            @click="$emit('showLoginModal')"
        >
            DISCORD LOGIN
        </a>
        <nuxt-link
            v-if="loggedInUser.staff.corsace"
            :to="`/${$route.params.year}/admin/years`"
        >
            ADMIN
        </nuxt-link>
        <nuxt-link
            v-if="isMCAStaff"
            :to="`/${$route.params.year}/staff`"
        >
            STAFF
        </nuxt-link>
        <nuxt-link
            v-if="site === 'mca' && mca && loggedInUser && mca.nomination.start <= new Date()"
            :to="`/${$route.params.year}/nominating`"
        >
            {{ $t('mca.main.nominating').toUpperCase() }}
        </nuxt-link>
        <nuxt-link
            v-if="site === 'mca' && mca && loggedInUser && mca.voting.start <= new Date()"
            :to="`/${$route.params.year}/voting`"
        >
            {{ $t('mca.main.voting').toUpperCase() }}
        </nuxt-link>
        <nuxt-link
            v-if="site === 'mca' && mca && (mca.results <= new Date() || (isMCAStaff && mca.voting.start <= new Date()))"
            :to="`/${$route.params.year}/results`"
        >
            {{ $t('mca.main.results').toUpperCase() }}
        </nuxt-link>
        <a href="/api/logout">
            {{ $t('mca_ayim.header.logout') }}
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Getter, State } from "vuex-class";
import { MCA } from "../../../Interfaces/mca";

import { UserMCAInfo } from "../../../Interfaces/user";

@Component
export default class TheHeaderDropdown extends Vue {
    
    @Prop({ type: String, required: true }) readonly site!: string;

    @State loggedInUser!: UserMCAInfo;
    @State mca!: MCA | null;
    @Getter isMCAStaff!: boolean;
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.dropdown {
    letter-spacing: 5px;
	position: absolute;
    cursor: pointer;
	right: 0;
    top: 103%;
    background-color: #0f0f0f;
    border-radius: 0 0 10px 10px;
    box-shadow: 0px 0px 8px white;
    margin-right: 2%;
    display: flex;
    flex-direction: column;
    z-index: 100;
    width: 15%;
    min-width: 200px;

    @include breakpoint(mobile) {
        width: 100%;
    }
    
    a {
        padding: 5% 0;
        color: white;
        text-decoration: none;
        text-align: center;
        
        @include transition('background-color, color');

        &:last-child {
            border-radius: 0 0 10px 10px;
        }

        &:hover {
            background-color: white;
            color: #0f0f0f;
        }
    }
}
</style>