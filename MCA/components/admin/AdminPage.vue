<template>
    <div class="admin">
        <div class="admin__section">
            <button 
                class="admin__button admin__add button"
                @click="showYearModal = !showYearModal"
            >
                add
            </button>
            <button 
                class="admin__button admin__remove button" 
                @click="deleteYear"
            >
                remove
            </button>
            <collapsible 
                class="admin__collapsible"
                title="years"
                :list="years"
                :show-extra="true"
                :active="true"
                @target="getCategories"
            />
            <admin-modal-year
                v-if="showYearModal"
                :info="selectedYear"
                @cancel="showYearModal = false"
                @updateYear="updateYear"
            />
        </div>

        <div
            v-if="selectedYear"
            class="admin__section"
        >
            <button
                class="admin__button admin__add button" 
                @click="showCategoryModal = !showCategoryModal"
            >
                add
            </button>
            <button 
                class="admin__button admin__remove button"
                @click="deleteCategory"
            >
                remove
            </button>
            <collapsible
                class="admin__collapsible"
                :title="'categories'"
                :list="activeCategories"
                :show-extra="true"
                :active="true"
                :scroll="true"
                @target="getBeatmaps"
            />
            <admin-modal-category
                v-if="showCategoryModal"
                :info="selectedCategory"
                :year="selectedYear.name"
                @cancel="showCategoryModal = false"
                @updateCategory="updateCategory"
            />
        </div>
        <div class="admin__section">
            <div class="admin__scroller">
                <choice-beatmapset-card
                    v-for="(item, i) in beatmaps"
                    :key="i"
                    :choice="item"
                    style="width:100%"
                />
            </div>
            <scroll-bar
                class="admin__scroll"
                selector=".admin__scroller"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import ChoiceBeatmapsetCard from "../ChoiceBeatmapsetCard.vue";
import Collapsible from "../Collapsible.vue";
import ScrollBar from "../ScrollBar.vue";
import AdminModalCategory from "./AdminModalCategory.vue";
import AdminModalYear from "./AdminModalYear.vue";

import { CategoryInfo } from "../../../Interfaces/category";
import { MCAInfo } from "../../../Interfaces/mca";

@Component({
    components: {
        ChoiceBeatmapsetCard,
        Collapsible,
        ScrollBar,
        AdminModalCategory,
        AdminModalYear,
    },
})
export default class AdminPage extends Vue {

    @State selectedMode!: string;

    showYearModal = false;
    showCategoryModal = false;
    years: MCAInfo[] = [];
    categories: CategoryInfo[] = [];
    beatmaps = [];
    selectedYear: MCAInfo | null = null;
    selectedCategory: CategoryInfo | null = null;

    get activeCategories (): CategoryInfo[] {
        return this.categories.filter(x => x.mode === this.selectedMode);
    }

    async getMcaInfo () {
        const res = (await this.$axios.get("/api/admin/")).data;

        if (res.error)
            this.$router.replace("/");

        if (res.mca) {
            this.years = res.mca;
            this.years.sort((a, b) => b.name - a.name);
        }
    }

    async updateYear () {
        this.showYearModal = false;
        await this.getMcaInfo();
    }

    async updateCategory () {
        this.showCategoryModal = false;

        if (this.selectedYear)
            await this.getCategories(this.selectedYear);
    }

    async getCategories (year: MCAInfo) {
        this.selectedYear = year;
        const res = (await this.$axios.get(`/api/admin/years/${this.selectedYear.name}`)).data;

        if (res.error) {
            alert(res.error);
            return;
        }

        this.categories = res.categories;
    }

    async getBeatmaps (category: CategoryInfo) {
        this.selectedCategory = category;
        const res = (await this.$axios.get(`/api/admin/categories/${this.selectedCategory.id}`)).data;
        if (res.error) {
            alert(res.error);
            return;
        }
        this.beatmaps = res.beatmaps;
    }

    async deleteYear () {
        if (!this.selectedYear || !confirm(`Are you sure you want to delete ${this.selectedYear.name}?`))
            return;

        const res = (await this.$axios.delete(`/api/admin/years/${this.selectedYear.name}/delete`)).data;

        if (res.error) {
            alert(res.error);
            return;
        }

        this.categories = [];
        this.selectedCategory = null;

        await this.getMcaInfo();
    }

    async deleteCategory () {
        if (!this.selectedCategory || !confirm(`Are you sure you want to delete ${this.selectedCategory.name}?`))
            return;
            
        const res = (await this.$axios.delete(`/api/admin/categories/${this.selectedCategory.id}/delete`)).data;

        if (res.error) {
            alert(res.error);
            return;
        }

        this.selectedCategory = null;

        if (this.selectedYear)
            await this.getCategories(this.selectedYear);
    }

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.admin {
    display: flex;

    height: 100%;
    width: 100%;
}

.admin__section {
    flex: 1;

    position: relative;
    height: 100%;
    margin-right: 12px;
    
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.admin__button {
    height: fit-content;

    margin: 12px;

    @include transition;
}

.admin__add {
    color: rgba(0, 255, 0, 0.6);
    text-shadow: 0 0 4px rgba(0, 255, 0, 0.6);
}

.admin__remove {
    color: rgba(255, 0, 0, 0.6);
    text-shadow: 0 0 4px rgba(255, 0, 0, 0.6);
}

.admin__collapsible {
    flex: 0 0 100%;

    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}

.admin__scroller {
    height: 100%;
    width: 100%;

    overflow-x: visible;
    overflow-y: scroll;

    mask-image: linear-gradient(to top, transparent 0%, black 25%);

    &::-webkit-scrollbar {
        opacity: 0;
    }
}

.admin__scroll {
    height: 100%;

    margin-right: -25px;
}

.admin__beatmap {
    width: 100%;
}

.adminPopout {
    position: fixed;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    
    height: 55%;
    width: 28%;
    
    background-color: rgba(0,0,0,0.9);
    box-shadow: 0 0 4px rgba(0,0,0,0.9);
    
    z-index: 100;
}

.adminPopout__section {
    display: flex;
    flex-direction: column;

    padding: 15px;
}

.adminPopout__input {
    font-family: 'Red Hat Display', sans-serif;

    color: black;

    background-color: rgb(115,115,115);
    box-shadow: 0 0 8px rgba(115, 115, 115, 0.61);

    border: 0;

    &:focus {
        outline: none;
    }
}
</style>