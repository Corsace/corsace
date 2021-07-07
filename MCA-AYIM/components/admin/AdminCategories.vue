<template>
    <div class="admin">
        <div class="admin-actions">
            <button 
                class="admin__button admin__add button"
                @click="create"
            >
                add
            </button>

            <nuxt-link
                class="admin__button admin__add button"
                to="../"
            >
                years
            </nuxt-link>
        </div>

        <data-table
            :fields="fields"
            :items="activeCategories"
        >
            <template #actions="{ item }">
                <button
                    class="button button--small"
                    @click="edit(item)"
                >
                    Edit
                </button>
                <button
                    class="button button--small"
                    @click="remove(item)"
                >
                    Remove
                </button>
            </template>
        </data-table>
        
        <admin-modal-category
            v-if="showModal"
            :info="selectedCategory"
            @cancel="showModal = false"
            @updateCategory="updateCategory"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import AdminModalCategory from "./AdminModalCategory.vue";
import DataTable, { Field } from "./DataTable.vue";

import { CategoryInfo } from "../../../Interfaces/category";

@Component({
    components: {
        AdminModalCategory,
        DataTable,
    },
    
})
export default class AdminCategories extends Vue {

    @State selectedMode!: string;
    
    showModal = false;
    categories: CategoryInfo[] = [];
    selectedCategory: CategoryInfo | null = null;
    
    fields: Field[] = [
        { key: "name", label: "Name" },
        { key: "maxNominations", label: "Max nominations" },
        { key: "requiresVetting", label: "Has Vetting" },
        { key: "type", label: "Type" },
        { key: "mode", label: "Mode" },
        { key: "isFiltered", label: "Has Filters" },
    ];

    get activeCategories (): CategoryInfo[] {
        return this.categories.filter(x => x.mode === this.selectedMode);
    }

    async mounted () {
        await this.getCategories();
    }

    async getCategories () {
        const { data } = await this.$axios.get(`/api/admin/years/${this.$route.params.adminYear}/categories`);

        if (data.error) {
            console.error(data.error);
            return;
        }

        this.categories = data.categories;
    }

    async updateCategory () {
        this.showModal = false;
        await this.getCategories();
    }

    create () {
        this.selectedCategory = null;
        this.showModal = true;
    }

    edit (category: CategoryInfo) {
        this.selectedCategory = category;
        this.showModal = true;
    }

    async remove (category: CategoryInfo) {
        if (!confirm(`Are you sure you want to delete ${category.name}?`))
            return;

        const { data } = await this.$axios.delete(`/api/admin/years/${this.$route.params.adminYear}/categories/${category.id}`);

        if (data.error) {
            alert(data.error);
            return;
        }

        await this.getCategories();
    }

}
</script>

<style lang="scss">

.admin-actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: .5rem;
}

</style>
