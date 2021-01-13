<template>
    <div class="locale">
        <transition name="fade">
            <div 
                v-if="showDropdown && availableLocales"
                class="locale__selector"
            >
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
        </transition>
        
        <div 
            class="locale__current" 
            @click="showDropdown = !showDropdown"
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
import { Vue, Component } from "vue-property-decorator";
import { NuxtVueI18n } from "nuxt-i18n";

import flagCodes from "../../../Assets/lang/flagCodes.json";

@Component
export default class TheFooterLanguagueSwitcher extends Vue {

    showDropdown = false;

    get availableLocales (): NuxtVueI18n.Options.LocaleObject[] | null {
        const locales = this.$i18n.locales as NuxtVueI18n.Options.LocaleObject[];
        if (locales) {
            const available = locales.filter(i => i.code !== this.$i18n.locale);
            return available;
        }
        return null;
    }

    switchLocale (localeCode: string) {
        this.$i18n.setLocale(localeCode);
        this.showDropdown = false;
    }

    getFlagUrl (localCode: string) {
        // Lang files are lazy-loaded so you can't load the flag directly from them
        return `https://osu.ppy.sh/images/flags/${flagCodes[localCode]}.png`;
    }
        
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

$end-margin: 10px;

.locale {
    display: flex;
    position: relative;
    width: 90px;
    margin-right: $end-margin;

    color: #cccccc;   
}

.locale__current {
    display: flex;
    margin: auto;

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
    text-transform: uppercase;
}

$selector-white: #fff6ed;
$selector-orange: #ff890a;
$selector-backdrop: #363636;

.locale__selector {
    position: absolute;
    display: flex;
    flex-direction: column;
    bottom: calc(100% + 3px); // + footer border
    padding: 5px 0;
    border-radius: 7px 0 0 0;

    color: $selector-white;
    background-color: $selector-orange;

    &::after {
        content: "";
        position: absolute;
        bottom: 0px;
        right: -$end-margin;
        
        width: $end-margin;
        height: 100%;
        background-color:#363636;
        box-shadow: inset 3px 0px 3px 0px rgba(0,0,0,0.75);
        z-index: -1;
    }
}

.locale__option {
    display: flex;
    align-items: center;
    padding: 5px 5px 5px 0;
    @include transition('background-color, border');
    cursor: pointer;

    .locale__flag {
        margin-left: 8px;
        margin-right: 8px;

        border: 2px solid;
        border-color: $selector-white;
        border-radius: 7px;

        @include transition('background-color');
    }

    &:hover {
        background-color: $selector-white;
        color: $selector-orange;

        .locale__flag {
            border-color: black;
        }
    }
}

</style>
