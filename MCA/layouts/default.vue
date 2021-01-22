<template>
    <div class="layout">
        <the-header site="mca" />

        <nuxt class="main" />
        
        <the-footer />
        
        <guest-difficulty-modal
            v-if="loggedInUser"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, State } from "vuex-class";

import TheHeader from "../../MCA-AYIM/components/header/TheHeader.vue";
import TheFooter from "../../MCA-AYIM/components/footer/TheFooter.vue";
import GuestDifficultyModal from "../components/GuestDifficultyModal.vue";

import { User } from "../../Interfaces/user";

@Component({
    components: {
        TheHeader,
        TheFooter,
        GuestDifficultyModal,
    },
})
export default class Default extends Vue {

    @State loggedInUser!: User;
    @Getter isMCAStaff!: boolean;

    async mounted () {
        await this.$store.dispatch("setInitialData");

        if (this.isMCAStaff) {
            await this.$store.dispatch("staff/setInitialData");
        }
    }
    
}
</script>
