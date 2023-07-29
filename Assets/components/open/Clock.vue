<template>
    <div class="clock">
        {{ time }}
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component()
export default class Clock extends Vue {
    time = "";
    timer: any = undefined;

    updateTime () {
        const now = new Date();
        const hh = String(now.getUTCHours()).padStart(2, "0");
        const mm = String(now.getUTCMinutes()).padStart(2, "0");
        const ss = String(now.getUTCSeconds()).padStart(2, "0");
        this.time = `${hh}:${mm}:${ss} UTC`;

        const delayUntilNextSecond = 1000 - (now.getMilliseconds());
        setTimeout(this.updateTime, delayUntilNextSecond);
    }

    mounted () {
        this.updateTime();
        this.timer = setInterval(this.updateTime, 1000);
    }
    beforeDestroy () {
        clearInterval(this.timer);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.clock {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: $font-xxl;
    padding: 10px;
}

</style>