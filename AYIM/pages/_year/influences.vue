<template>
    <mode-switcher
        v-if="mca"
        hide-phase
        tablet
        stretch
        :ignore-modes="['storyboard']"
    >
        <div class="influences-page">
            <search-bar
                :placeholder="$t('ayim.comments.search')"
                @update:search="resetSearch($event)"
            />

            <div class="treeview-container">
                <ul
                    v-if="root"
                    class="treeview"
                >
                    <li class="treeview__root">
                        <img
                            :src="`https://osu.ppy.sh/images/flags/${root.country}.png`"
                            :alt="root.country"
                            class="treeview__flag"
                        >
                        {{ root.osu.username }}
                        <InfluenceTreeLeaf :influences="root.influences" />
                    </li>
                </ul>
            </div>
        </div>
    </mode-switcher>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";
import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import InfluenceTreeLeaf from "../../components/InfluenceTreeLeaf.vue";
import SearchBar from "../../../MCA-AYIM/components/SearchBar.vue";
import { MCA } from "../../../Interfaces/mca";

const influencesModule = namespace("influences");

@Component({
    components: {
        ModeSwitcher,
        InfluenceTreeLeaf,
        SearchBar,
    },
})
export default class Comments extends Vue {

    @State mca!: MCA;
    
    @influencesModule.State users!: any[];
    @influencesModule.State root!: Record<string, any> | null;

    @influencesModule.Action search;
    @influencesModule.Action resetRoot;
    
    async resetSearch (userSearch) {
        this.resetRoot();
        this.search(userSearch);
    }
    
}
</script>

<style lang="scss">
.influences-page {
    display: flex;
    flex-flow: column;
    padding: 30px;
}

.treeview-container {
    background-color: rgba(0, 0, 0, .65);
    box-shadow: 0 0 8px rgb(0 0 0 / 63%);
    padding: 5px 20px;
    margin: 5px;
    border-radius: 5.5px;
}

.treeview, .treeview__leaf {
    padding: 0;
    list-style: none;
}

.treeview {
    &__leaf {
        margin-left: 1em;
        position: relative;

        &:before {
            content: '';
            display: block;
            width: 0;
            position: absolute;
            top: 0;
            left: 0;
            border-left: 1px solid;
            bottom: 15px;
        }
        
        & .treeview__leaf {
            margin-left: .5em
        }

    }

    &__leaf-item {
        margin: 0;
        padding: 0 1em;
        line-height: 2em;
        font-weight: 700;
        position: relative;

        &:hover {    
            cursor: pointer;
        }

        &:before {
            content: '';
            display: block;
            width: 10px;
            height: 0;
            border-top: 1px solid;
            margin-top: -1px;
            position: absolute;
            top: 1em;
            left: 0;
        }
    }

    &__user {
        display: flex;
        align-items: center;
    }

    &__flag {
        height: 1em;
        border-radius: 3px;
        margin-right: 5px;
    }

    &__link {
        display: flex;
        margin-left: 5px;
    }
}
</style>
