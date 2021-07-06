<template>    
    <span 
        v-if="section === 'beatmaps'"
        class="table-headings"
    >
        <span class="table-headings__mapplace">{{ $t('mca.results.place') }}</span>
        <span class="table-headings__map">{{ $t('mca.results.map') }}</span>
        <span class="table-headings__title">{{ $t('mca.results.title') }}</span>
        <span class="table-headings__artist">{{ $t('mca.results.artist') }}</span>
        <span class="table-headings__host">{{ $t('mca.results.host') }}</span>
        <span class="table-headings__firsts">{{ $t('mca.results.firsts') }}</span>
        <span class="table-headings__votes">{{ $t('mca.results.votes') }}</span>
        <span class="table-headings__vote-right" />
    </span>
    <span
        v-else
        class="table-headings"
    >
        <span class="table-headings__userplace">{{ $t('mca.results.place') }}</span>
        <span class="table-headings__user">{{ $t('mca.results.user') }}</span>
        <span class="table-headings__firsts">{{ $t('mca.results.firsts') }}</span>
        <span class="table-headings__votes">{{ $t('mca.results.votes') }}</span>
        <span class="table-headings__vote-right" />
    </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";

@Component({})
export default class ResultsFilters extends Vue {
    @Prop({ type: String, default: ""}) readonly section!: string;
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

    &__mapplace {
        min-width: 3rem;
        flex: 1.5;
        margin-right: 15px;

        display: flex;
    }

    &__userplace {
        min-width: 3rem;
        flex: 4;
        margin-right: 15px;

        display: flex;
    }

    &__map {
        display: inline;
        flex: 6;

        @include breakpoint(tablet) {
            display: none;
        }
    }

    &__title {
        display: none;

        @include breakpoint(tablet) {
            display: inline;
            flex: 6;
        }
    }

    &__artist {
        display: none;

        @include breakpoint(tablet) {
            display: inline;
            flex: 4;
        }
    }

    &__host {
        display: none;

        @include breakpoint(tablet) {
            display: inline;
            flex: 2.25;
        }
    }

    &__user {
        flex: 6;
        
        @include breakpoint(tablet) {
            flex: 10.25;
        }
    }

    &__firsts {
        display: none;

        @include breakpoint(tablet) {
            min-width: 3rem;
            flex: 1.5;

            display: flex;
            justify-content: center;
        }
    }

    &__votes {
        flex: 1.5;

        display: flex;
        justify-content: center;
    }

    &__vote-right {
        flex: 0.5;
        margin-right: 65px;
    }
}
</style>