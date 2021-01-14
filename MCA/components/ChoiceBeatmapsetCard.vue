<template>
    <base-choice-card
        :choice="choice"
        @choose="$emit('choose')"
    >
        <a
            class="choice__info"
            :style="bgImg"
            :href="`https://osu.ppy.sh/beatmapsets/${choice.id}`"
            target="_blank"
        >
            <div class="choice__info-title">
                {{ choice.title }}
            </div>
            <div class="choice__info-artist">
                {{ choice.artist }}
            </div>
            <span class="choice__info-host">
                HOSTED BY | <span class="choice__info-hoster">{{ choice.hoster }}</span>
            </span>
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
            return { "background-image": `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url('https://assets.ppy.sh/beatmaps/${this.choice.id}/covers/cover.jpg?1560315422')` };

        return { "background-image": "" };
    }

}
</script>
