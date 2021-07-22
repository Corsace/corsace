<template>
    <base-modal
        :title="$t('mca_ayim.login.login')"
        @close="close"
    >
        <div 
            class="login__text"
            v-html="$t('mca_ayim.login.message.1')"
        />
        <div class="login__auth">
            <img src="../../../Assets/img/osu.png">
            <a 
                v-if="!loggedInUser || !loggedInUser.osu || !loggedInUser.osu.username"
                class="login__auth-text"
                :href="'/api/login/osu?site=' + site + '&redirect=' + $route.fullPath"
            >
                {{ $t('mca_ayim.login.authOsu') }}
            </a>
            <span 
                v-else
                class="login__auth-complete"
            >
                {{ $t('mca_ayim.login.authOsuComp') }} <b>{{ loggedInUser.osu.username }}!</b>
            </span>
        </div>
        <span 
            v-if="loggedInUser"
            class="login__text"
            v-html="$t('mca_ayim.login.message.2')"
        />
        <div 
            v-if="loggedInUser"
            class="login__auth"
        >
            <img src="../../../Assets/img/social/discord.png">
            <a 
                v-if="!loggedInUser.discord || !loggedInUser.discord.username"
                class="login__auth-text"
                :href="'/api/login/discord?site=' + site + '&redirect=' + $route.fullPath"
            >
                {{ $t('mca_ayim.login.authDiscord') }}
            </a>
            <span 
                v-else
                class="login__auth-complete"
            >
                {{ $t('mca_ayim.login.authDiscordComp') }} <b>{{ loggedInUser.discord.username }}!</b>
            </span>
        </div>
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserMCAInfo } from "../../../Interfaces/user";

import BaseModal from "../BaseModal.vue";

@Component({
    components: {
        BaseModal,
    },
})
export default class LoginModal extends Vue {

    @State loggedInUser!: UserMCAInfo | null;

    @Prop({ type: String, required: true }) readonly site!: string;

    close () {
        this.$emit("close");
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.login__text {
    margin: 35px;
    font-size: $font-xl;
}

.login__auth {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}

.login__auth-text {
    cursor: pointer;
    margin: 35px;
    padding: 12px 100px;
    background-color: white;
    border-radius: 15px;
    box-shadow: 0px 0px 16px #ffffff;

    color: black;
    font-style: italic;
    text-shadow: 0px 0px 16px #000000;
    font-size: $font-xl;
}

.login__auth-complete {
    padding: 12px 100px;
    margin: 35px;
}
</style>
