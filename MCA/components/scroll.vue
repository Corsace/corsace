<template>
    <div class="scroll">
        <div class="scroll__bar" />
        <div 
            class="scroll__thumb triangle"
            :class="`triangleActive--${selectedMode}`"
            :style="{'top':relativePos}"
        />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: {
        scrollPos: {
            type: Number,
            default: 0,
        },
        scrollSize: {
            type: Number,
            default: 0,
        },
        selectedMode: {
            type: String,
            default: "standard",
        },
    },
    data () {
        return {
            pos: 0,
            bottom: false,
        };
    },
    computed: {
        relativePos(): string {
            const percent = this.scrollPos / this.scrollSize * 100;
            let currentlyBottom = false;
            if (percent >= 99)
                currentlyBottom = true;
            this.emit(currentlyBottom);
            
            return percent - 2 + "%";
        },
    },
    methods: {
        emit(currentlyBottom: boolean): void {
            if (currentlyBottom !== this.bottom) {
                this.bottom = currentlyBottom;
                if (currentlyBottom === true)
                    this.$emit("bottom");
            }
        },
    },
});
</script>

<style lang="scss">
.scroll {
    height: 95%;

    position: absolute;
    right: 0;
    top: 0;
}

.scroll__bar {
    background-image: repeating-linear-gradient(white, white 1px, transparent 1px, transparent 10px);

    height: 100%;
    width: 7px;
    margin-right: 25px;
}

.scroll__thumb {
    position: absolute;

    transform: rotate(-90deg);

    right: 13px;
}
</style>