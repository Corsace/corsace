<template>
    <div class="mappool">
        <div class="mappool__header">
            MAPPOOL TEXT THING
            <hr class="line--red line--bottom-space">
            <hr class="line--red line--bottom-space">
        </div>
        <MappoolView 
            :pool="qualifiersStage?.mappool[0]"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component} from "vue-property-decorator";
import { namespace } from "vuex-class";

import MappoolView from "../../Assets/components/open/MappoolView.vue";

import { Tournament } from "../../Interfaces/tournament";
import { Stage } from "../../Interfaces/stage";

const openModule = namespace("open");

@Component({
    components: {
        MappoolView,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Mappool extends Vue {

    @openModule.State tournament!: Tournament | null;

    get qualifiersStage (): Stage | null {
        return this.tournament?.stages.find(s => s.stageType === 0) || null;
    }
}
</script>

<style lang="scss">
</style>
```