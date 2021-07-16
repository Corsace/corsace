<template>
    <base-choice-card
        :choice="choice"
        @choose="$emit('choose')"
    >
        <a
            class="choice__info"
            :style="bgImg"
            :href="`https://osu.ppy.sh/users/${choice.userID}`"
            target="_blank"
        >
            <div class="choice__info-title">
                {{ choice.username }}
            </div>
            <div class="choice__info-secondary">
                <span class="choice__info-artist">
                    {{ choice.otherNames.length ? choice.otherNames.join(", ") : "&#x2800;" }}
                </span>
            </div>
        </a>
    </base-choice-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import BaseChoiceCard from "../../MCA-AYIM/components/BaseChoiceCard.vue";

@Component({
    components: {
        BaseChoiceCard,
    },
})
export default class ChoiceUserCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    get bgImg (): any {
        if (this.choice)
            return { "background-image": `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${this.choice.avatar})` };

        return { "background-image": "" };
    }

}
</script>
