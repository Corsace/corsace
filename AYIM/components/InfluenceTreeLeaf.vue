<template>
    <ul>
        <li 
            v-for="influence in influences" 
            :key="influence.ID"
        >
            <a
                href="#"
                @click="showAndSearch(influence.influence.osu.userID)"
            >
                {{ influence.influence.osu.userID }} - {{ influence.influence.osu.username }}
            </a>
            <InfluenceTreeLeaf
                v-if="show && findUser(influence.influence.osu.userID) && findUser(influence.influence.osu.userID).influences"
                :influences="findUser(influence.influence.osu.userID).influences"
            />
        </li>
    </ul>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";

const influencesModule = namespace("influences");

@Component({
    name: "InfluenceTreeLeaf",
})
export default class InfluenceTreeLeaf extends Vue {
    
    @Prop({ type: Array, required: true }) readonly influences!: any[];

    @influencesModule.State users;
    
    @influencesModule.Action search;

    show = false;

    showAndSearch (osuId: number) {
        this.search({
            user: osuId,
            year: this.$route.params.year,
        });
        this.show = true;
    }

    findUser (userId) {
        return this.users.find(u => u.osu.userID == userId);
    }

}
</script>
