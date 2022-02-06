<template>
    <ul class="treeview__leaf">
        <li
            v-for="influence in influences"
            :key="influence.ID" 
            class="treeview__leaf-item"
        >
            <a
                href="#"
                class="treeview__user"
                @click="showAndSearch(influence.influence.osu.userID)"
            >
                <img
                    :src="`https://osu.ppy.sh/images/flags/${influence.influence.country}.png`"
                    :alt="influence.influence.country"
                    class="treeview__flag"
                >
                {{ influence.influence.osu.username }}
                <a
                    :href="`https://osu.ppy.sh/users/${influence.influence.osu.userID}#beatmaps`"
                    target="_blank"
                    class="treeview__link"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-link-45deg"
                        viewBox="0 0 16 16"
                    >
                        <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z" />
                        <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z" />
                    </svg>
                </a>
            </a>
            
            <InfluenceTreeLeaf
                v-if="expandedInfluencesFor.some(i => i === influence.influence.osu.userID) && savedInflueces(influence.influence.osu.userID)"
                :influences="savedInflueces(influence.influence.osu.userID)"
            />
        </li>
    </ul>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { User } from "../../Interfaces/user";

const influencesModule = namespace("influences");

@Component({
    name: "InfluenceTreeLeaf",
})
export default class InfluenceTreeLeaf extends Vue {
    
    @Prop({ type: Array, required: true }) readonly influences!: any[];

    @influencesModule.State users!: User[];
    
    @influencesModule.Action search;

    expandedInfluencesFor: string[] = []

    showAndSearch (userId: string) {
        if (!this.findUser(userId)) {
            this.search(userId);
        }

        const i = this.expandedInfluencesFor.findIndex(i => i == userId);
        if (i !== -1) {
            this.expandedInfluencesFor.splice(i, 1);
        } else {
            this.expandedInfluencesFor.push(userId);
        }
    }

    findUser (userId: string) {
        return this.users.find(u => u.osu.userID == userId);
    }

    savedInflueces (userId: string) {
        return this.findUser(userId)?.influences;
    }

}
</script>
