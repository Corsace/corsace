<template>
    <base-choice-card
        :choice="choice"
        :image-url="choice.avatar"
        @choose="$emit('choose')"
    >
        <a
            :href="`https://osu.ppy.sh/users/${choice.userID}`"
            target="_blank"
            class="choice__text--title"
        >
            {{ choice.username }}
        </a>
        <div class="choice__text choice__text--subtitle">
            {{ choice.otherNames.length ? choice.otherNames.join(", ") : "&#x2800;" }}
        </div>
    </base-choice-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";
import BaseChoiceCard from "../../MCA-AYIM/components/BaseChoiceCard.vue";

const mcaAyimModule = namespace("mca-ayim");

@Component({
    components: {
        BaseChoiceCard,
    },
})
export default class ChoiceUserCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    @mcaAyimModule.State selectedMode!: string;

}
</script>
