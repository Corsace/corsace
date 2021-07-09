<template>
    <div class="map-container">
        <div class="map">
            <a
                class="map-info"
                :style="bgImg"
                :href="`https://osu.ppy.sh/beatmapsets/${choice.id}`"
                target="_blank"
            >
                <span class="map-info__place">{{ choice.placement }}</span>
                <div class="map-info__map">
                    <div class="map-info__map-title">
                        {{ choice.title }}
                    </div>
                    <div class="map-info__map-artist">
                        {{ choice.artist }}
                    </div>
                    <span class="map-info__map-host">
                        {{ $t('mca.nom_vote.hosted') }} | <span class="map-info__map-hoster">{{ choice.hoster }}</span>
                    </span>
                </div>
                <span class="map-info__title">{{ choice.title }}</span>
                <span class="map-info__artist">{{ choice.artist }}</span>
                <span class="map-info__host">{{ choice.hoster }}</span>
                <span class="map-info__votes">{{ choice.votes }}</span>
                <span class="map-info__vote-right" />
            </a>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class ResultsBeatmapsetCard extends Vue {
    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    get bgImg (): any {
        if (this.choice)
            return { "background-image": `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url('https://assets.ppy.sh/beatmaps/${this.choice.id}/covers/cover.jpg?1560315422')` };

        return { "background-image": "" };
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.map {
    &-container {
        flex: 0 0 auto;
        width: 100%;
    }

    @extend %flex-box;
    padding: 0;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);
    cursor: pointer;

    @include transition();

    &:hover {
        box-shadow: 0 0 12px rgba(255,255,255,0.75);
    }

}

.map-info {
    display: flex;

    border-radius: 10px;
    padding: 15px;
    width: 100%;

    background-size: cover;
    background-position: 34% 30%;
    overflow: hidden;

    color: white;
    text-decoration: none;

    &__place {
        flex: 2;
        display: flex;
        align-items: center;
        text-shadow: 0 0 4px white;
        font-size: $font-lg;
        @extend %text-wrap;
    }

    &__title {
        display: none;
        @extend %text-wrap;

        @include breakpoint(tablet) {
            display: inline;
            flex: 6;
            text-shadow: 0 0 4px rgba(255,255,255,0.6);
            font-weight: 500;
            font-size: $font-lg;
            box-sizing: border-box;
            padding-right: 8px;
        }
    }

    &__artist {
        display: none;
        @extend %text-wrap;

        @include breakpoint(tablet) {
            display: inline;
            flex: 4;
            text-shadow: 0 0 4px rgba(255,255,255,0.6);
            font-size: $font-lg;
            box-sizing: border-box;
            padding-right: 8px;
        }
    }

    &__map {
        flex: 11;

        &-title {
            display: inline;
            text-shadow: 0 0 2px white;
            font-weight: 500;
            font-size: $font-lg;
            @extend %text-wrap;

            @include breakpoint(tablet) {
                display: none;
            }
        }

        &-artist {
            text-shadow: 0 0 4px white;
            font-size: $font-base;
            @extend %text-wrap;

            @include breakpoint(tablet) {
                display: none;
            }
        }

        &-host {
            @extend %text-wrap;

            @include breakpoint(tablet) {
                display: none;
            }
        }

        &-hoster {
            text-shadow: 0 0 4px white;
            font-style: italic;
            @extend %text-wrap;

            @include breakpoint(tablet) {
                display: none;
            }
        }

        @include breakpoint(tablet) {
                display: none;
            }
    }

    &__host {
        display: none;
        @extend %text-wrap;

        @include breakpoint(tablet) {
            display: inline;
            flex: 4;
            margin-right: auto;
            text-shadow: 0 0 4px rgba(255,255,255,0.6);
            font-size: $font-lg;
            box-sizing: border-box;
            padding-right: 8px;
        }
    }

    &__votes {
        display: flex;
        align-items: center;
        justify-content: center;

        text-shadow: 0 0 4px white;
        font-size: $font-lg;
        
        flex: 1.5;
        @extend %text-wrap;
    }

    &__vote-right {
        flex: 0.5;
    }
}
</style>