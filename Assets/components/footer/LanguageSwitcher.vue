<template>
    <div class="locale">
        <transition name="fade">
            <div
                v-if="showDropdown && availableLocales"
                class="locale__selector"
                :class="`locale__selector--${viewTheme}`"
            >
                <div
                    v-for="locale in availableLocales"
                    :key="locale.code"
                    class="locale__option locale__text"

                    @click="switchLocale(locale.code)"
                >
                    {{ locale.code }}
                </div>
            </div>
        </transition>
        
        <div 
            class="locale__current" 
            @click="showDropdown = !showDropdown"
        >
            <div class="locale__text">
                {{ $i18n.locale }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";
import { NuxtVueI18n } from "nuxt-i18n";

@Component
export default class LanguagueSwitcher extends Vue {

    @State viewTheme!: "light" | "dark";

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
        
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.locale {
    display: flex;
    position: relative;
    width: 40px;
    @include breakpoint(laptop) {
        width: 45px;
    }
}

.locale__current {
    display: flex;
    align-items: center;
    margin: auto;

    cursor: pointer;
}

.locale__text {
    user-select: none;
}

$gray: #343434;
$selector-white: #fff6ed;
$selector-orange: #ff890a;

.locale__selector {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    right: 0;
    bottom: 100%;
    padding: 5px 10px;
    width: 40px;
    @include breakpoint(laptop) {
        width: 45px;
    }
    border-radius: 7px 7px 0 0;

    &--light {
        color: black;
        background-color: white;
    }
    &--dark {
        color: $selector-white;
        background-color: $dark-gray;
    }
}

.locale__option {
    text-align: center;
    padding: 5px 5px 5px 0;
    cursor: pointer;

    &:hover {
        background-color: $selector-white;
        color: $selector-orange;
    }
}

</style>
