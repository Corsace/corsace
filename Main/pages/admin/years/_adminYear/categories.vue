<template>
    <div class="admin">
        <div class="admin__actions">
            <button 
                class="admin__button admin__add button"
                @click="create"
            >
                add
            </button>

            <nuxt-link
                class="admin__button admin__link admin__add button"
                to="../"
            >
                years
            </nuxt-link>

            <nuxt-link
                class="admin__button admin__link admin__add button"
                to="/admin"
            >
                admin
            </nuxt-link>

            <nuxt-link
                class="admin__button admin__link admin__add button"
                to="/"
            >
                home
            </nuxt-link>
        </div>

        
        <div class="admin__actions">
            <button 
                class="admin__button admin__add button"
                @click="changeMode('standard')"
            >
                standard
            </button>

            <button 
                class="admin__button admin__add button"
                @click="changeMode('taiko')"
            >
                taiko
            </button>
            
            <button 
                class="admin__button admin__add button"
                @click="changeMode('fruits')"
            >
                fruits
            </button>

            <button 
                class="admin__button admin__add button"
                @click="changeMode('mania')"
            >
                mania
            </button>

            <button 
                class="admin__button admin__add button"
                @click="changeMode('storyboard')"
            >
                storyboard
            </button>
        </div>


        <data-table
            :fields="fields"
            :items="activeCategories"
        >
            <template #actions="{ item }">
                <button
                    class="admin__button button button--small"
                    @click="edit(item)"
                >
                    Edit
                </button>
                <button
                    class="admin__button button button--small"
                    @click="remove(item)"
                >
                    Remove
                </button>
            </template>
        </data-table>
        
        <admin-modal-category
            v-if="showModal"
            :info="selectedCategory"
            :mode="selectedMode"
            @cancel="showModal = false"
            @updateCategory="updateCategory"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserInfo } from "../../../../../Interfaces/user";
import AdminModalCategory from "../../../../../Assets/components/admin/AdminModalCategory.vue";
import DataTable, { Field } from "../../../../../Assets/components/DataTable.vue";

import { CategoryInfo } from "../../../../../Interfaces/category";

@Component({
    components: {
        AdminModalCategory,
        DataTable,
    },
    head () {
        return {
            title: "Admin - Categories | MCA",
        };
    },
})
export default class Years extends Vue {
    @State loggedInUser!: UserInfo;

    async mounted () {
        if (!(this.loggedInUser?.staff?.corsace || this.loggedInUser?.staff?.headStaff))
            return this.$router.replace("/");
        
        await this.getCategories();
    }

    selectedMode = "standard";
    showModal = false;
    categories: CategoryInfo[] = [];
    selectedCategory: CategoryInfo | null = null;
    
    fields: Field[] = [
        { key: "name", label: "Name" },
        { key: "maxNominations", label: "Max nominations" },
        { key: "type", label: "Type" },
        { key: "mode", label: "Mode" },
        { key: "isFiltered", label: "Has Filters" },
    ];

    get activeCategories (): CategoryInfo[] {
        return this.categories.filter(x => x.mode === this.selectedMode);
    }

    async getCategories () {
        const { data } = await this.$axios.get<{ categories: CategoryInfo[] }>(`/api/admin/years/${this.$route.params.adminYear}/categories`);

        if (!data.success) {
            console.error(data.error);
            return;
        }

        this.categories = data.categories;
    }

    async updateCategory () {
        this.showModal = false;
        await this.getCategories();
    }

    changeMode (mode: string) {
        this.selectedMode = mode;
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

        if (!data.success) {
            alert(data.error);
            return;
        }

        await this.getCategories();
    }
}
</script>
