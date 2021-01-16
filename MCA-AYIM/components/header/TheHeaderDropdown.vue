<template>
    <div 
        class="dropdown"
        @click="$emit('close')"
    >
        <a 
            v-if="!loggedInUser.discord || !loggedInUser.discord.userID"
            @click="$emit('showLoginModal')"
        >
            DISCORD LOGIN
        </a>
        <nuxt-link
            v-if="loggedInUser.staff.corsace"
            :to="'/admin'"
        >
            ADMIN
        </nuxt-link>
        <nuxt-link
            v-if="isMCAStaff"
            :to="'/staff'"
        >
            STAFF
        </nuxt-link>
        <a href="/api/logout">
            {{ $t('mca_ayim.header.logout') }}
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserMCAInfo } from "../../../Interfaces/user";

@Component
export default class TheHeaderDropdown extends Vue {

    @State loggedInUser!: UserMCAInfo;
    
    get isMCAStaff (): boolean {
        return this.loggedInUser.staff.corsace || 
                this.loggedInUser.staff.headStaff || 
                this.loggedInUser.mcaStaff.standard ||
                this.loggedInUser.mcaStaff.taiko ||
                this.loggedInUser.mcaStaff.mania ||
                this.loggedInUser.mcaStaff.fruits ||
                this.loggedInUser.mcaStaff.storyboard;
    }
        
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