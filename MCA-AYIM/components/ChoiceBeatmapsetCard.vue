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
                {{ choice.title }} {{ $route.params.year >= 2021 ? `[${choice.difficulty}]` : "" }}
            </div>
            <div class="choice__text--subtitle">{{ choice.artist }}</div>
        </a>
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

}
</script>
