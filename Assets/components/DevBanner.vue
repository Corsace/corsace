<template>
    <div 
        class="dev_banner"
        :class="`dev_banner--${site}_${viewTheme}`"
        @click="$emit('close')"
    >
        This site is a work in progress! Please be patient as we work to improve it, add features, and fix bugs as they arise. 😃 <span>X</span>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class DevBanner extends Vue {
    @State viewTheme!: "light" | "dark";
    @State site!: string;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.dev_banner {
    cursor: pointer;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    & span {
        position: relative;
        bottom: 10px;
        left: 10px;
        font-size: $font-xxl;
        font-weight: bold;
    }

    &--mca-ayim {
        &_light {
            background-color: white;
            color: $alt-blue;

            & span {
                color: $dark;
            }

            &:hover {
                background-color: $white;
            }
        }

        &_dark {
            background-color: $dark;
            color: $blue;

            & span {
                color: white;
            }

            &:hover {
                background-color: $darker-gray;
            }
        }
    }

    &--open {
        &_light {
            background-color: #2F2F2F;
            color: $white;

            & span {
                color: $open-red;
            }

            &:hover {
                background-color: $dark;
            }
        }

        &_dark {
            background-color: #2F2F2F;
            color: $white;

            & span {
                color: $open-red;
            }

            &:hover {
                background-color: $dark;
            }
        }
    }
}
</style>
