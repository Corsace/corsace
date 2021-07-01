<template>
    <div class="layout">
        <the-header site="ayim" />

        <nuxt class="main" />
        
        <the-footer />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import TheHeader from "../../MCA-AYIM/components/header/TheHeader.vue";
import TheFooter from "../../MCA-AYIM/components/footer/TheFooter.vue";

@Component({
    components: {
        TheHeader,
        TheFooter,
    },
    middleware: "mca",
})
export default class Default extends Vue {
    
    @State selectedMode!: string;

    async mounted () {
        await this.$store.dispatch("setSelectedMode");
        if (this.selectedMode === "storyboard")
            this.$store.dispatch("updateSelectedMode", "standard");
    }
    
}
</script>
