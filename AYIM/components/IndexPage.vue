<template>
    <div class="general-info">
        <div
            class="general-info__text" 
            v-if="mca"
            v-html="$t(`ayim.main.message.${mca.year}`)" 
        />
        
        <div 
            v-if="mca"
            class="ayim-nav ayim-nav--front"
        >
            <nuxt-link
                :to="`/${mca.year}/mapsets/records`"
                class="ayim-nav__item button"
            >
                {{ $t('ayim.mapsets.name') }}
            </nuxt-link>
            <nuxt-link
                :to="`/${mca.year}/mappers/records`"
                class="ayim-nav__item button"
            >
                {{ $t('ayim.mappers.name') }}
            </nuxt-link>
            <nuxt-link
                :to="`/${mca.year}/comments`"
                class="ayim-nav__item button"
            >
                {{ $t('ayim.comments.name') }}
            </nuxt-link>
        </div>
        <div 
            v-else
            class="noMCA"
        >
            There is no MCA/AYIM for {{ $route.params.year }} currently! Check back later!
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { MCA } from "../../Interfaces/mca";

@Component
export default class IndexPage extends Vue {

    @State selectedMode!: string;
    @State mca!: MCA;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_partials';
@import '@s-sass/_mixins';

.general-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 15px 0 0 15px; 
    background-color: $bg-dark; 
    padding: 30px;
    margin-bottom: 30px;
    height: 100%;
    
    @include breakpoint(laptop) {
        padding: 30px 70px;
    }

    &__text {
        font-size: $font-lg;
        
        @include breakpoint(mobile) {
            font-size: $font-base;
        }
    }
}

.noMCA {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
}

</style>
