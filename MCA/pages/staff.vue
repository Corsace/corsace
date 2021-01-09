<template>
    <div>
        <div />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Axios from "axios";

interface Category {
    ID: number;
    name: string;
    modeID: number;
    maxNominations: number;
    isRequired: boolean;
    beatmapsets: object[];
}

export default Vue.extend({
    data () {
        return {
            categories: [] as Category[],
            beatmapsets: [],
            selectedCategory: {} as Category,
            modes: [],
            info: "",
            name: "",
            newCategoryMode: 0,
            maxNominations: 1,
            isRequired: false,
        };
    },
    async mounted () {
        const res = await Axios.get("/api/staff/categories/");

        if (res.data && !res.data.error) {
            this.categories = res.data.categories;
            this.beatmapsets = res.data.beatmapsets;
            this.modes = res.data.modes;
        }
    },
    methods: {
        async create () {
            this.info = "";
            const res = await Axios.post(`/api/staff/categories/create`, {
                name: this.name,
                mode: this.newCategoryMode,
                maxNominations: this.maxNominations,
                isRequired: this.isRequired,
            });
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                this.categories.push(res.data);
                this.info = "ok";
            }
        },
        async update () {
            if (!this.selectedCategory) {
                return;
            }
            
            this.info = "";
            const res = await Axios.post(`/api/staff/categories/${this.selectedCategory.ID}/update`, {
                name: this.selectedCategory.name,
                beatmapsets: this.selectedCategory.beatmapsets,
                mode: this.selectedCategory.modeID,
                maxNominations: this.selectedCategory.maxNominations,
                isRequired: this.selectedCategory.isRequired,
            });
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                const i = this.categories.findIndex(c => c.ID === this.selectedCategory.ID);
                Vue.set(this.categories, i, res.data);
                this.info = "ok";
            }
        },
        async remove () {
            if (!this.selectedCategory) {
                return;
            }

            this.info = "";
            const res = await Axios.post(`/api/staff/categories/${this.selectedCategory.ID}/remove`);
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                const i = this.categories.findIndex(c => c.ID === this.selectedCategory.ID);

                if (i !== -1) {
                    this.categories.splice(i, 1);
                }
            }
        },
    },
});
</script>
