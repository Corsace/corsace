<template>
    <base-modal
        v-if="overlay"
        :title="title"
        @close="closeOverlay"
    >
        <div
            class="notice-modal" 
            v-html="text.replace('[YEAR]', $route.params.year)" 
        />
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

import BaseModal from "../../MCA-AYIM/components/BaseModal.vue";

import { MCA } from "../../Interfaces/mca";

@Component({
    components: {
        BaseModal,
    },
})
export default class NoticeModal extends Vue {

    @State mca!: MCA;

    @Prop({ type: String, required: true }) readonly title!: string;
    @Prop({ type: String, required: true }) readonly text!: string;
    @Prop({ type: String, required: true }) readonly localKey!: string;

    overlay = false;

    async mounted () {
        await this.toggleOverlay();
    }

    async toggleOverlay () {
        if (!localStorage.getItem(this.localKey + this.$route.params.year)) {
            this.overlay = true;
        }
    }

    async closeOverlay () {
        this.overlay = false;
        localStorage.setItem(this.localKey + this.$route.params.year, "true");
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.notice-modal {
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

    & > a, &--bold {
        font-weight: bold;
    }

    & > a {
        text-decoration: underline;
    }
}
</style>