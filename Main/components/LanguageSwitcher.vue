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
                    class="locale__option locale__text"

                    @click="switchLocale(locale.code)"
                >
                    {{ getLanguageName(locale.code) }}
                </div>
            </div>
        </transition>
        
        <div 
            class="locale__current" 
            @click="showDropdown = !showDropdown"
        >
            <div class="locale__text">
                {{ getLanguageName($i18n.locale) }}
            </div>
            <div class="arrow arrow--up" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { NuxtVueI18n } from "nuxt-i18n";

@Component
export default class TheFooterLanguagueSwitcher extends Vue {

    showDropdown = false;

    languages = {
        "cn": "chinese",
        "de": "german",
        "en": "english",
        "es": "spanish",
        "fr": "french",
        "id": "indonesian",
        "jp": "japanese",
        "kr": "korean",
    }

    get availableLocales (): NuxtVueI18n.Options.LocaleObject[] | null {
        const locales = this.$i18n.locales as NuxtVueI18n.Options.LocaleObject[];
        if (locales) {
            const available = locales.filter(i => i.code !== this.$i18n.locale);
            return available;
        }
        return null;
    }

    switchLocale (localeCode: string): void {
        this.$i18n.setLocale(localeCode);
        this.showDropdown = false;
    }

    getLanguageName (localeCode: string): string {
        for (const code in this.languages) {
            if (localeCode === code)
                return this.languages[code];
        }

        return "";
    }
        
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.locale {
    display: flex;
    position: relative;
    width: 90px;
    margin-right: 30px;
}

.locale__current {
    display: flex;
    align-items: center;
    margin: auto;

    cursor: pointer;
}

.locale__text {
    user-select: none;
    text-transform: uppercase;
}

$gray: #343434;
$selector-white: #fff6ed;
$selector-orange: #ff890a;

.locale__selector {
    position: absolute;
    display: flex;
    flex-direction: column;
    right: 0;
    bottom: 100%;
    padding: 5px 10px;
    border-radius: 7px 7px 0 0;

    color: $selector-white;
    background-color: $gray;
}

.locale__option {
    text-align: center;
    padding: 5px 5px 5px 0;
    @include transition('background-color, border');
    cursor: pointer;

    &:hover {
        background-color: $selector-white;
        color: $selector-orange;
    }
}

</style>
