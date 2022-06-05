<template>
    <base-choice-card
        :choice="choice"
        :image-url="imageUrl"
        :link="beatmapLink"
    >
        <a
            class="choice__text"
            :class="`choice__text--${viewTheme}`"
            :href="beatmapLink"
            target="_blank"
        >
            <div>
                {{ choice.title }}
            </div>
            <div class="choice__text--subtitle">{{ choice.artist }}</div>
        </a>
        <div 
            v-if="$route.params.year >= 2021"
            class="choice__text choice__text--subtitle"
            :class="`choice__text--${viewTheme}`"
            :style="difficultyColour"
        >
            {{ `[${choice.difficulty}]` }} {{ choice.sr.toFixed(2) }} ☆
        </div>
        <a
            class="choice__text"
            :class="`choice__text--${viewTheme}`"
            :href="userLink"
            target="_blank"
        >
            <span class="choice__text--subtitle">
                hosted by 
            </span>
            <span class="choice__text--title">
                {{ choice.hoster }}
            </span>
        </a>
    </base-choice-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";
import BaseChoiceCard from "./BaseChoiceCard.vue";

// Taken from https://github.com/ppy/osu-web/blob/master/resources/assets/lib/utils/beatmap-helper.ts
const srPoints = [0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9];
const rPoints = [66, 79, 79, 124, 210, 210, 210, 198, 101, 72, 145];
const gPoints = [144, 192, 210, 210, 210, 128, 78, 69, 99, 63, 145];
const bPoints = [210, 210, 210, 79, 92, 104, 111, 184, 210, 142, 145];

@Component({
    components: {
        BaseChoiceCard,
    },
})
export default class ChoiceBeatmapsetCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    @State viewTheme!: "light" | "dark";

    get imageUrl (): string {
        if (this.choice)
            return `https://assets.ppy.sh/beatmaps/${parseInt(this.$route.params.year, 10) < 2021 ? this.choice.id : this.choice.setID}/covers/cover.jpg?1560315422`;

        return "";
    }

    get beatmapLink (): string {
        return parseInt(this.$route.params.year) < 2021 ? `https://osu.ppy.sh/beatmapsets/${this.choice.id}` : `https://osu.ppy.sh/beatmaps/${this.choice.id}`;
    }

    get userLink (): string {
        return `https://osu.ppy.sh/users/${this.choice.hostID}`;
    }

    get difficultyColour () {
        if (parseInt(this.$route.params.year) < 2021)
            return {};

        if (this.choice.sr >= 9)
            return {
                "text-overflow": "ellipsis",
                overflow: "hidden",
                "white-space": "nowrap",
                "font-weight": "bold",
                color: "rgb(145,145,145)",
            };
        if (this.choice.sr < 0.1)
            return {
                "text-overflow": "ellipsis",
                overflow: "hidden",
                "white-space": "nowrap",
                "font-weight": "bold",
                color: "rgb(145,145,145)",
            };

        let index = -1;
        for (const val of srPoints) {
            if (this.choice.sr >= val)
                index++;
            else 
                break;
        }

        const r = rPoints[index] + (this.choice.sr - srPoints[index]) * (rPoints[index + 1] - rPoints[index]) / (srPoints[index + 1] - srPoints[index]);
        const g = gPoints[index] + (this.choice.sr - srPoints[index]) * (gPoints[index + 1] - gPoints[index]) / (srPoints[index + 1] - srPoints[index]);
        const b = bPoints[index] + (this.choice.sr - srPoints[index]) * (bPoints[index + 1] - bPoints[index]) / (srPoints[index + 1] - srPoints[index]);

        return {
            "text-overflow": "ellipsis",
            overflow: "hidden",
            "white-space": "nowrap",
            "font-weight": "bold",
            color: `rgb(${r},${g},${b})`,
        };
    }
}
</script>
