<template>
    <div 
        class="dropdown"
        @click="$emit('close')"
    >
        <a 
            v-if="!user.discord || !user.discord.userID"
            @click="$emit('login')"
        >
            DISCORD LOGIN
        </a>
        <nuxt-link
            v-if="user.staff.corsace"
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
import Vue, { PropOptions } from "vue";

import { UserMCAInfo } from "../../../CorsaceModels/user";

export default Vue.extend({
    props: {
        user: {
            type: Object,
            required: true,
        } as PropOptions<UserMCAInfo>,
    },
    computed: {
        isMCAStaff (): boolean {
            return this.user.staff.corsace || 
                this.user.staff.headStaff || 
                this.user.mcaStaff.standard ||
                this.user.mcaStaff.taiko ||
                this.user.mcaStaff.mania ||
                this.user.mcaStaff.fruits ||
                this.user.mcaStaff.storyboard;
        },
    },
});
</script>

<style lang="scss">
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
    
    a {
        padding: 5% 0;
        color: white;
        text-decoration: none;
        text-align: center;
        transition: background-color 0.25s ease-out, color 0.25s ease-out;

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