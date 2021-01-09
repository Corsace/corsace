<template>
    <div class="login">
        <div 
            class="login__close"
            @click="close"
        >
            X
        </div>
        <div class="login__title">
            {{ $t('mca_ayim.login.login') }}
        </div>
        <div 
            class="login__text"
            v-html="$t('mca_ayim.login.message.1')"
        />
        <div class="login__auth">
            <img src="../../../CorsaceAssets/img/osu.png">
            <a 
                v-if="!user || !user.osu || !user.osu.username"
                class="login__authText"
                :href="'/api/login/osu?url=' + $route.fullPath"
            >
                {{ $t('mca_ayim.login.authOsu') }}
            </a>
            <span 
                v-else
                class="login__authComplete"
            >
                {{ $t('mca_ayim.login.authOsuComp') }} <b>{{ user.osu.username }}!</b>
            </span>
        </div>
        <span 
            class="login__text"
            v-html="$t('mca_ayim.login.message.2')"
        />
        <div class="login__auth">
            <img src="../../../CorsaceAssets/img/ayim-mca/site/discord.png">
            <a 
                v-if="!user || !user.discord || !user.discord.username"
                class="login__authText"
                href="/api/login/discord"
            >
                {{ $t('mca_ayim.login.authDiscord') }}
            </a>
            <span 
                v-else
                class="login__authComplete"
            >
                {{ $t('mca_ayim.login.authDiscordComp') }} <b>{{ user.discord.username }}!</b>
            </span>
        </div>
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
    methods: {
        close () {
            this.$emit("close");
        },
    },
});
</script>

<style lang="scss">
.login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    width: 100%;
    height: 100%;

    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;

    background-color: rgba(0,0,0,0.83);
    backdrop-filter: blur(7px);

    z-index: 100;
    
    text-align: center;
    font-size: 1.5rem;
    text-shadow: 0px 0px 16px #ffffff;

    a {
        margin: 35px;
    }
}

.login__close {
    font-size: 5rem;
    position: fixed;
    top: 20%;
    right: 20%;
    cursor: pointer;
}

.login__title {
    font-family: 'Lexend Peta';
    font-size: 3rem;
}

.login__text {
    margin: 35px;
}

.login__auth {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.login__authText {
    cursor: pointer;
    padding: 12px 100px;
    background-color: white;
    border-radius: 15px;
    color: black;
    font-style: italic;
    text-shadow: 0px 0px 16px #000000;
    box-shadow: 0px 0px 16px #ffffff;
}

.login__authComplete {
    padding: 12px 100px;
    margin: 35px;
}
</style>