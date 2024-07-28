<template>
    <div class="open_matchup_time">
        <div class="open_matchup_time__time">
            {{ formatTime(dateSync) }}
        </div>
        <div class="open_matchup_time__timezone">
            {{ timezoneSync }}
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component
export default class OpenMatchupTime extends Vue {
    @PropSync("date", { type: Date, required: false, default: null }) dateSync!: Date;
    @PropSync("timezone", { type: String, default: "UTC" }) timezoneSync!: string;

    formatTime (date: Date | null): string {
        if (!date) return "";
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.open_matchup_time {
    
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    font-family: $font-univers;

    &__time {
        font-size: calc(1.25 * $font-xxxl);
        font-weight: 700;
        font-stretch: condensed;
        letter-spacing: 0em;
        text-align: center;
    }
    
    &__timezone {
        font-size: $font-sm;
        font-weight: 600;
        color: $open-red;
    }
}
</style>