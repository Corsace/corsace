<template>
    <div class="locale">
        <transition name="fade">
            <div 
                v-if="change"
                class="locale__selector"
            >
                <div class="options">
                    <div
                        v-for="locale in availableLocales"
                        :key="locale.code"
                        class="locale__option"

                        @click="switchLocale(locale.code)"
                    >
                        <img  
                            :src="getFlagUrl(locale.code)" 
                            class="locale__flag" 
                        >
                        <div class="locale__text">
                            {{ locale.code.toUpperCase() }}
                        </div>
                    </div>
                </div>
                <div class="backdrop" />
            </div>
        </transition>
        
        <div 
            class="locale__current" 
            @click="change = !change"
        >
            <img 
                :src="$t('flag')"
                class="locale__flag"
            >
            <div class="locale__text">
                {{ $i18n.locale.toUpperCase() }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { NuxtVueI18n } from "nuxt-i18n";
import lang from "../../../CorsaceAssets/lang/index";

export default Vue.extend({
    data () {
        return {
            change: false,
        };
    },
    computed: {
        availableLocales () {
            const locales = this.$i18n.locales as NuxtVueI18n.Options.LocaleObject[];
            if (locales) {
                const available = locales.filter(i => i.code !== this.$i18n.locale);
                return available;
            }
            return null;
        },
    },
    methods: {
        switchLocale: function (localeCode: string) {
            this.$i18n.setLocale(localeCode);
            this.change = false;
        },
        getFlagUrl: function(localCode: string) {
            return lang[localCode].flag;
        },
    },
});

</script>

<style lang="scss">

.locale {
    display: flex;
    flex-direction: column;
    align-items: center;

    position: absolute;
    right: 20px;

    height: 100%;
    width: 90px; 

    color: #cccccc;   
}

.locale__current {
    display: flex;
    align-items: center;
    justify-content: center;

    position: absolute;

    height: 100%;
    width: 100%;

    cursor: pointer;
}

.locale__flag {
    height: 25px;
    margin-right: 10px;
    user-select: none;
}

.locale__text {
    font-size: 20px;
    user-select: none;
}

$selector-white: #fff6ed;
$selector-orange: #ff890a;
$selector-backdrop: #363636;

.locale__selector {
    position: relative;
    bottom: 3px;
    transform: translateY(-100%);

    width: 110%;    
    padding: 5px 0;
    border-radius: 7px 0 0 0;
    box-sizing: border-box;

    color: $selector-white;
    background-color: $selector-orange;

    .backdrop {
        position: absolute;
        bottom: 0px;
        right: -50px;
        
        width: 50px;
        height: 100%;
        background-color:#363636;
        box-shadow: inset 3px 0px 3px 0px rgba(0,0,0,0.75);
    }
}

.locale__option {
    display: flex;
    align-items: center;

    width: 100%;
    padding: 5px 0;

    cursor: pointer;

    .locale__flag {
        margin-left: 10px;
        margin-right: 8px;

        border: 2px solid;
        border-color: $selector-white;
        border-radius: 7px;

        transition: border-color 0.25s ease-out;
    }

    transition: background-color 0.25s ease-out, color 0.25s ease-out;

    &:hover {
        background-color: $selector-white;
        color: $selector-orange;

        .locale__flag {
            border-color: black;
        }
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity .25s ease-out;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
</style>