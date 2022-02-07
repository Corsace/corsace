<template>
    <base-choice-card :choice="choice">
        <a
            class="choice__info"
            :style="bgImg"
            :href="$route.params.year < 2021 ? `https://osu.ppy.sh/beatmapsets/${choice.id}` : `https://osu.ppy.sh/beatmaps/${choice.id}`"
            target="_blank"
        >
            <div class="choice__info-title">
                {{ choice.title }}
            </div>
            <div class="choice__info-secondary">
                <span class="choice__info-artist">{{ choice.artist }}</span>
                <span class="choice__info-host">|
                    <span class="choice__info-hoster">{{ choice.hoster }} {{ $route.params.year >= 2021 ? `[${choice.difficulty}]` : "" }}</span>
                </span>
            </div>
        </a>
    </base-choice-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import BaseChoiceCard from "./BaseChoiceCard.vue";

@Component({
    components: {
        BaseChoiceCard,
    },
})
export default class ChoiceBeatmapsetCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    get bgImg (): any {
        if (this.choice)
            return { "background-image": `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url('https://assets.ppy.sh/beatmaps/${parseInt(this.$route.params.year, 10) < 2021 ? this.choice.id : this.choice.setID}/covers/cover.jpg?1560315422')` };

        return { "background-image": "" };
    }

}
</script>
