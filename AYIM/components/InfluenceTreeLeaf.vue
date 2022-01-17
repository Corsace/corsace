<template>
    <ul>
        <li 
            v-for="influence in influences" 
            :key="influence.ID"
        >
            <a
                href="#"
                @click="search(influence.influence.osu.userID)"
            >
                {{ influence.influence.osu.userID }} - {{ influence.influence.osu.username }}
            </a>
            <InfluenceTreeLeaf
                v-if="findUser(influence.influence.osu.userID) && findUser(influence.influence.osu.userID).influences"
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

    findUser (userId) {
        return this.users.find(u => u.osu.userID == userId);
    }

}
</script>
