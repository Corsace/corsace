<template>
    <div :class="['beatmap', `beatmap--${statusLabel}`]">
        <div :class="['beatmap__slot', `beatmap__slot--${slotType}`]">
            {{ mappoolSlot }}
        </div>
        <div class="beatmap__container">
            <img
                v-if="beatmap"
                class="beatmap__background"
                :src="`https://assets.ppy.sh/beatmaps/${beatmap.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg`"
            >
            <div
                v-if="winner"
                :class="['beatmap__win', `beatmap__win--${winner}`]"
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
import { defineComponent, PropType } from "vue";
import { MappoolMap } from "../../../Interfaces/mappool";
import { MapStatus } from "../../../Interfaces/matchup";

export default defineComponent({
    props: {
        mappoolSlot: {
            type: String as PropType<string | null>,
            default: null,
        },
        beatmap: {
            type: Object as PropType<MappoolMap | null>,
            default: null,
        },
        status: {
            type: Number as PropType<MapStatus>,
            required: true,
        },
        winner: {
            type: String as PropType<"red" | "blue" | null>,
            default: null,
        },
    },
    computed: {
        statusLabel () {
            if (this.beatmap === null) {
                if (this.status === MapStatus.Picked) return "picking";
                if (this.status === MapStatus.Banned) return "banning";
                if (this.status === MapStatus.Protected) return "protecting";
            }

            if (this.beatmap !== null) {
                if (this.status === MapStatus.Banned) return "banned";
                if (this.status === MapStatus.Protected) return "protected";
            }

            return "";
        },
        slotType () {
            return this.mappoolSlot?.slice(0, 2).toLowerCase();
        },
    },
});
</script>

<style lang="scss">
@import '@s-sass/_variables';

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
  }

  &__background {
    width: 100%;
    height: 100%;
    object-fit: cover;

    background: linear-gradient(238.85deg, #5BBCFA -12.24%, rgba(91, 188, 250, 0) 70.46%);
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
    justify-content: end;

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
