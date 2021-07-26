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
