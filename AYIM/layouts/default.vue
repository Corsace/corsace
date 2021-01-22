<template>
    <div class="layout">
        <the-header site="ayim" />

        <nuxt class="main" />
        
        <the-footer />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter } from "vuex-class";

import TheHeader from "../../MCA-AYIM/components/header/TheHeader.vue";
import TheFooter from "../../MCA-AYIM/components/footer/TheFooter.vue";

@Component({
    components: {
        TheHeader,
        TheFooter,
    },
})
export default class Default extends Vue {

    @Getter isMCAStaff!: boolean;

    async mounted () {
        await this.$store.dispatch("setInitialData");
    }
    
}
</script>
