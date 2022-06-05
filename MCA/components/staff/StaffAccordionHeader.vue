<template>
    <div
        class="staff-accordion-header"
        :class="{ 'staff-accordion-header--active': active }"
        @click.prevent="$emit('on-click')"
    >
        <a
            class="staff-accordion-header__left"
            href="#"
            @click.prevent
        >
            {{ left }}
        </a>
        <span class="staff-accordion-header__right">{{ right }}</span>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";

@Component
export default class StaffAccordionHeader extends Vue {
    // Props: 
    //   - 'left' specifies left-justified text
    //   - 'right' specifies right-justified text
    //   - 'active' determines whether or not the header is considered active
    // Events:
    //   - emits 'on-click' when the header is clicked

    @Prop({ type: String, default: ""}) readonly left!: string;
    @Prop({ type: String, default: "" }) readonly right!: string;
    @Prop({ type: Boolean, default: false }) readonly active!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_partials';

.staff-accordion {
    &-header {
        @extend %flex-box;
        position: static;
        font-size: $font-lg;
        font-weight: 500;
        top: 0;
        z-index: 10;

        &:hover {
            background-color: black;
            cursor: pointer;
        }

        > * {
            padding: 3px 0;
        }

        &__right {
            margin-left: auto;
        }
    }

    &-body {
        @extend %flex-box;
        position: relative;
        flex-direction: column;
        padding: 0 20px;
    }

    &-section {
        display: flex;
        flex-direction: column;
        margin: 0 0 10px 0;
        border-bottom: 1px solid white;

        &__heading {
            padding-top: 5px;
        }
    }
}
</style>
