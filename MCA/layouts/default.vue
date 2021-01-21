<template>
    <div
        :style="loadingTransition"
        class="layout"
    >
        <the-header site="mca" />

        <transition name="fade">
            <nuxt class="main" />
        </transition>
        
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

        if (this.isMCAStaff) {
            await this.$store.dispatch("staff/setInitialData");
        }
    }
    
}
</script>
