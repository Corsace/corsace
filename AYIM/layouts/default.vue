<template>
    <div
        :style="loadingTransition"
        class="layout"
    >
        <the-header site="ayim" />

        <transition name="fade">
            <nuxt class="main" />
        </transition>
        
        <the-footer />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import TheHeader from "../../MCA-AYIM/components/header/TheHeader.vue";
import TheFooter from "../../MCA-AYIM/components/footer/TheFooter.vue";

@Component({
    components: {
        TheHeader,
        TheFooter,
    },
})
export default class Default extends Vue {

    loaded = false;

    get loadingTransition () {
        if (!this.loaded)
            return {
                opacity: 0,
            };
        else
            return {
                opacity: 1,
            };
    }

    async mounted () {
        await this.$store.dispatch("setInitialData");
        this.loaded = true;
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    @include transition;
}

.main {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
}
</style>
