<template>
    <div class="localeSwitch">
        <ul class="dropdown" v-if="localeChange">
            
            <div
                v-for="locale in availableLocales"
                :key="locale.code"
                class="localeLanguage"

                @click="switchLocale(locale.code)"
            >
                <div class="localeLeft">
                    {{ locale.code.toUpperCase() }}
                </div>
                <div class="localeRight">
                    <img  
                        :src="getFlagUrl(locale.code)" 
                        class="localeFlag" 
                    >
                </div>
            </div>
        </ul>

        <div 
            class="localeCurrent" 
            @click="localeChange = !localeChange"
        >
            
            <div class="localeLeft">
                {{ $i18n.locale.toUpperCase() }}
            </div>
            <img 
                :src="$t('flag')"
                class="localeFlag"
            >
            <div class="triangle">
                <img v-if="!localeChange" src="../../../Assets/img/open/triangle.png">
                <img class="upsideDown" v-if="localeChange" src="../../../Assets/img/open/triangle.png">
            </div>
        </div>
    </div>
</template>

<script lang='ts'>
import { Vue, Component } from "vue-property-decorator";
import { NuxtVueI18n } from "nuxt-i18n";

import flagCodes from "../../../Assets/lang/flagCodes.json";


@Component
export default class LocaleChanger extends Vue {
    localeChange = false;


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
        this.localeChange = false;
    }

    getFlagUrl (localCode: string) {
        // Lang files are lazy-loaded so you can't load the flag directly from them
        return `https://osu.ppy.sh/images/flags/${flagCodes[localCode]}.png`;
    }
        
}
</script>

<style>
.localeSwitch {
    display:flex;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    padding: 0 10px;
}

.localeLanguage, .localeCurrent {
    font-size: 19px;
    color: #73797e;
    font-weight: bold;
    cursor: pointer;
}

.localeCurrent {
    display: flex;
    align-items: center;	
}

.localeFlag {
    padding: 0 3px;
    height: 17px;
}

.localeLeft {
    position: relative;
    right: 2px;
    float: left;
    width: 50%;
}

.localeRight {
    position: relative;
    left: 2px;
    float: right;
    width: 50%;
    text-align: left;
}

.triangle {
    display: flex;
    padding-left: 4px;
}

.upsideDown {
    transform: rotate(180deg);
}

.dropdown {
    background-color: #101010;
    background-image: none;
    border-radius: 0 0 20px 20px;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: absolute;
    top: 84px;
    padding: 17px 17px 0 17px;
    z-index: 99;
    flex-wrap: wrap;
    margin: 0;
}

.dropdown .localeLanguage {
    list-style: none;
    margin: 0 0 20px 0;
}
</style>
