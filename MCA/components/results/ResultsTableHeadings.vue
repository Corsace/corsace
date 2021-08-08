<template>
    <span class="table-headings">
        <span
            v-for="(col, i) in columns"
            :key="i"
            :class="[((col.name) ? `heading-${col.name}` : `heading-${col.label}`),
                     ((col.centred) ? ' heading-centred' : ''),
                     ((col.prio) ? ' heading-prio' : '')]"
            :style="{'flex': `${mobile && col.msize ? col.msize : col.size}`}"
        >
            <span
                v-if="col.hasTooltip"
                v-tooltip="{
                    content: $t(`mca.results.tooltips.${col.label}`),
                    class: 'table-tooltip',
                    placement: 'top',
                    delay: 0,
                }"
            >
                {{ col.label ? $t(`mca.results.headings.${col.label}`) : "" }}
            </span>

            <span v-else>{{ col.label ? $t(`mca.results.headings.${col.label}`) : "" }}</span>
        </span>
    </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";
import { ResultColumn } from "../../../Interfaces/result";
import Tooltip from "vue-directive-tooltip";

Vue.use(Tooltip);

@Component({})
export default class ResultsTableHeadings extends Vue {
    @Prop({ type: String, default: ""}) readonly section!: string;
    @Prop({ type: Array, required: true}) readonly columns!: ResultColumn[];
    @Prop({ type: Boolean, default: false }) readonly mobile!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.table-tooltip {
    padding: 5px 20px;
    
    max-width: 35vw;
    @include breakpoint(tablet) {
        max-width: 20vw;
    }

    background: black;
    border: 1px solid $gray-dark;
    border-radius: 5.5px;

    font-size: 0.9rem;
    font-family: $font-body;

    opacity: 0;
    animation: fadeIn ease-out 0.2s;
    animation-delay: 300ms;
    animation-fill-mode: both;
}

@keyframes fadeIn {
    0% {
        opacity: 0
    }

    100% {
        opacity: 1
    }
}

.table-headings {
    padding: 0 5px 0 5px;

    font-size: 0.9rem;
    font-family: $font-body;
    text-transform: uppercase;

    flex: initial;
    display: flex;
    align-items: center;

    > :first-child {
        margin-right: 17px;
    }

    > :last-child {
        margin-right: 68px;
    }
}

.heading {
    &-centred {
        display: flex;
        justify-content: center;
        text-align: center;
    }

    &-prio {
        min-width: 3rem;
    }
}
</style>