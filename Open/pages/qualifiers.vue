<template>
    <div class="qualifiers">
        a
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import OpenButton from "../../Assets/components/open/OpenButton.vue";

@Component({
    components: {
        OpenButton,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Qualifiers extends Vue {

    async mounted () {
        await this.$store.dispatch("setInitialData", "open");
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
</style>