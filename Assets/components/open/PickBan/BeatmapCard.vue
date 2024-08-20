<template>
    <div :class="['beatmap', `beatmap--${statusLabel}`]">
        <div :class="['beatmap__slot', `beatmap__slot--${slotType}`]">
            {{ mappoolSlotSync }}
        </div>
        <div class="beatmap__container">
            <img
                v-if="beatmapSync"
                class="beatmap__background"
                :src="`https://assets.ppy.sh/beatmaps/${beatmapSync.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg`"
            >
            <div
                v-if="winnerSync"
                :class="['beatmap__win', `beatmap__win--${winnerSync}`]"
            >
                <span class="beatmap__win-label">win</span>
            </div>
            <div class="beatmap__state-gradient" />
            <div class="beatmap__state-bar">
                <div class="beatmap__state-label">
                    {{ statusLabel }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { MappoolMap } from "../../../../Interfaces/mappool";
import { MapStatus } from "../../../../Interfaces/matchup";

@Component({})
export default class BeatmapCard extends Vue {
    @PropSync("mappoolSlot", { type: String, default: null }) mappoolSlotSync!: string | null;
    @PropSync("beatmap", { type: Object, default: null }) beatmapSync!: MappoolMap | null;
    @PropSync("status", { type: Number, required: true }) statusSync!: MapStatus;
    @PropSync("winner", { type: String, default: null }) winnerSync!: "red" | "blue" | null;

    statusToLabel: Record<"progress" | "done", Record<MapStatus, string>> = {
        progress: {
            [MapStatus.Picked]: "picking",
            [MapStatus.Banned]: "banning",
            [MapStatus.Protected]: "protecting",
        },
        done: {
            [MapStatus.Picked]: "",
            [MapStatus.Banned]: "banned",
            [MapStatus.Protected]: "protected",
        },
    };

    get statusLabel () {
        if (!this.beatmapSync)
            return this.statusToLabel.progress[this.statusSync];
        return this.statusToLabel.done[this.statusSync];
    }

    get slotType () {
        return this.mappoolSlotSync?.slice(0, 2).toLowerCase();
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

@keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
}

.beatmap {
    $self: &;

    display: flex;
    flex-direction: column;

    width: 144px;
    height: 435px;
    padding: 4px;

    background: linear-gradient(0deg, #0F0F0F 0%, #2F2F2F 100%);

    &--banned {
        --bar-color: #F24141;
    }

    &--protected {
        --bar-color: #5BBCFA;
    }

    &--picking, &--banning, &--protecting {
        --bar-color: #2F2F2F;
    }

    &--picking {
        --gradient-color: #FFFFFF;
    }

    &--banning {
        --gradient-color: #F24141;
    }

    &--protecting {
        --gradient-color: #5BBCFA;
    }

    &__slot {
        font-size: 40px;
        font-weight: 700;
        font-family: $font-univers;
        margin: 0 auto;

        &--nm {
            color: #5BBCFA;
        }

        &--hd {
            color: #FBBA20;
        }

        &--hr {
            color: #F24141;
        }

        &--dt {
            color: #D17AFF;
        }

        &--fm {
            color: #8FDA53;
        }

        &--tb {
            color: #EBEBEB;
        }
    }

    &__container {
        position: relative;

        width: 100%;
        height: 100%;

        animation: fade 0.4s;
    }

    &__background {
        width: 100%;
        height: 100%;
        object-fit: cover;

        background: linear-gradient(238.85deg, #5BBCFA -12.24%, rgba(91, 188, 250, 0) 70.46%);
        animation: fade 0.4s;
    }

    &__state-gradient {
        position: absolute;
        top: 0;
        left: 0;

        width: 136px;
        height: 100%;

        background: linear-gradient(238.85deg, var(--gradient-color) -12.24%, rgba(91, 188, 250, 0) 70.46%);
    }

    &__state-bar {
        position: absolute;
        top: 0;
        right: 0;

        height: 100%;
        width: 48px;

        padding-top: 10px;

        background: linear-gradient(180deg, var(--bar-color) 59.7%, rgba(217, 217, 217, 0) 99%);
    }

    #{$self}--banning &__state-gradient,
    #{$self}--banning &__state-bar,
    #{$self}--protecting &__state-gradient,
    #{$self}--protecting &__state-bar,
    #{$self}--picking &__state-gradient,
    #{$self}--picking &__state-bar {
        animation: fade 2.5s alternate infinite;
    }

    &__state-label {
        font-family: $font-univers;
        font-size: 36px;
        font-weight: 500;
        letter-spacing: 0.095em;
        color: #FFFFFF;
        text-transform: uppercase;

        transform: rotate(90deg);

        #{$self}--banning & {
            color: #F24141;
        }

        #{$self}--protecting & {
            color: #5BBCFA;
        }
    }

    &__win {
        position: absolute;
        left: 0;
        top: 0;

        width: 100%;
        height: 100%;

        background: linear-gradient(180deg, rgba(29, 29, 29, 0) 0%, #1D1D1D 71.87%);

        display: flex;
        flex-direction: column;
        justify-content: flex-end;

        &--red {
            color: #F24141;
        }

        &--blue {
            color: #5BBCFA;
        }
    }

    &__win-label {
        font-family: $font-univers;
        font-size: 40px;
        font-weight: 500;
        letter-spacing: 0.16em;
        text-indent: 0.16em;
        text-align: center;
        text-transform: uppercase;
    }
}
</style>
