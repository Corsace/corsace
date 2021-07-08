<template>
    <span class="table-headings">
        <span
            v-for="(col, i) in filtCol"
            :key="i"
            :class="((col.name) ? `heading-${col.name}` : `heading-${col.label}`) +
                    ((col.centred) ? ' heading-centred' : '') + 
                    ((col.prio) ? ' heading-prio' : '')"
            :style="{'flex': `${mobile && col.msize ? col.msize : col.size}`}"
        >
            {{ (col.label) ? $t(`mca.results.headings.${col.label}`) : '' }}
        </span>
    </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";
import { ResultColumn } from "../../../Interfaces/result";

@Component({})
export default class ResultsFilters extends Vue {
    @Prop({ type: String, default: ""}) readonly section!: string;
    @Prop({ type: Array, required: true}) readonly columns!: ResultColumn[];
    @Prop({ type: Boolean, default: false }) readonly mobile!: boolean;
    
    get filtCol() {
        return this.columns.filter(
            c => (!c.category || c.category === this.section) &&
            ((c.mobileOnly && this.mobile) || 
             (c.desktopOnly && !this.mobile) ||
             (!c.mobileOnly && !c.desktopOnly))
        );
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.table-headings {
    padding: 0 5px 0 5px;

    font-size: 0.9rem;
    font-family: $font-body;
    text-transform: uppercase;

    flex: initial;
    display: flex;
    align-items: center;

    > :first-child {
        margin-right: 15px;
    }

    > :last-child {
        margin-right: 68px;
    }
}

.heading {
    &-centred {
        display: flex;
        justify-content: center;
    }

    &-prio {
        min-width: 3rem;
    }
}
</style>