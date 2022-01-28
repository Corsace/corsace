<template>
    <div>
        <input
            v-model="userSearch"
            type="text"
            @change="resetSearch"
        >

        <ul v-if="root">
            <li>
                {{ root.osu.userID }} - {{ root.osu.username }}
                <InfluenceTreeLeaf :influences="root.influences" />
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import InfluenceTreeLeaf from "../../components/InfluenceTreeLeaf.vue";

const influencesModule = namespace("influences");

@Component({
    components: {
        InfluenceTreeLeaf,
    },
})
export default class Comments extends Vue {

    userSearch = ""
    
    @influencesModule.State users!: any[];
    @influencesModule.State root!: Record<string, any> | null;

    @influencesModule.Action search;
    @influencesModule.Action resetRoot;
    
    async resetSearch () {
        this.resetRoot();
        this.search({
            user: this.userSearch, 
            year: this.$route.params.year,
        });
    }
    
}
</script>
