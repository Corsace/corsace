<template>
    <base-modal
        :title="$t('ayim.comments.name')"
        v-if="overlay"
        @close="closeOverlay"
    >
        <div
            v-html="$t('ayim.comments.notice').replace('[YEAR]', $route.params.year)" 
            class="comments-modal" 
        />
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import BaseModal from "../../MCA-AYIM/components/BaseModal.vue";

import { MCA } from "../../Interfaces/mca";

@Component({
    components: {
        BaseModal,
    },
})
export default class CommentsModal extends Vue {

    @State mca!: MCA;

    overlay = false;

    async mounted () {
        await this.toggleOverlay();
    }

    async toggleOverlay () {
        if (!localStorage.getItem("overlay" + this.$route.params.year)) {
            this.overlay = true;
        }
    }

    async closeOverlay () {
        this.overlay = false;
        localStorage.setItem("overlay" + this.$route.params.year, "true");
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.comments-modal {
    font-size: 1rem;
    line-height: 2rem;
    @include breakpoint(tablet) {
        font-size: 1.25rem;
        line-height: 3.5rem;
    }
    @include breakpoint(desktop) { 
        font-size: 1.5rem;
        line-height: 5rem;
    }
}
</style>