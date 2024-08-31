<template>
    <base-modal @close="$emit('cancel')">
        <div class="admin-popout">
            <admin-inputs
                v-model="category"
                :fields="fields"
            />

            <div 
                v-if="isBeatmapsetType && category" 
                class="admin-popout__section"
            >
                auto filters
                <input
                    v-model="category.isFiltered"
                    type="checkbox"
                    class="admin-popout__input"
                >
            </div>
            <div 
                v-else-if="isUsersType && filterParams"
                class="admin-popout__section"
            >
                rookie
                <input
                    v-model="filterParams.rookie"
                    type="checkbox"
                    class="admin-popout__input"
                >
            </div>

            <div v-if="category?.isFiltered && isBeatmapsetType">
                <admin-inputs
                    v-model="filterParams"
                    :fields="filterFields"
                />

                <div 
                    v-if="filterParams"
                    class="admin-popout__section"
                >
                    top diff Only
                    <input
                        v-model="filterParams.topOnly"
                        type="checkbox"
                        class="admin-popout__input"
                    >
                </div>
            </div>
            
            <button
                class="button"
                @click="save"
            >
                save
            </button>
            <button
                class="button"
                @click="$emit('cancel')"
            >
                cancel
            </button>
        </div>
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component, PropSync, Watch } from "vue-property-decorator";

import BaseModal from "../../../Assets/components/BaseModal.vue";
import AdminInputs from "./AdminInputs.vue";

import { Category, CategoryFilter, CategoryInfo, CategoryType } from "../../../Interfaces/category";
import { InputField } from "./AdminInputs.vue";

@Component({
    components: {
        BaseModal,
        AdminInputs,
    },
})
export default class AdminModalCategory extends Vue {

    @PropSync("info", { type: Object, default: () => null }) readonly infoSync!: CategoryInfo | null;
    @PropSync("mode", { type: String, default: "" }) readonly modeSync!: string;

    @Watch("info", { immediate: true })
    onInfoChanged (info: CategoryInfo | null) {
        this.category = {
            name: info?.name ?? "",
            type: info?.type && info.type in CategoryType ? CategoryType[info.type as keyof typeof CategoryType] : CategoryType.Beatmapsets,
            maxNominations: info?.maxNominations ?? 3,
            isFiltered: info?.isFiltered ?? false,
        };

        this.filterParams = {
            minLength: info?.filter?.minLength,
            maxLength: info?.filter?.maxLength,
            minBPM: info?.filter?.minBPM,
            maxBPM: info?.filter?.maxBPM,
            minSR: info?.filter?.minSR,
            maxSR: info?.filter?.maxSR,
            minCS: info?.filter?.minCS,
            maxCS: info?.filter?.maxCS,
            topOnly: info?.filter?.topOnly,
        };
    }
    
    category: Partial<Category> & { isFiltered: boolean } | null = null;
    filterParams: CategoryFilter | null = null;

    fields = [
        { label: "name", key: "name" },
        { label: "type", key: "type", type: "select", options: [{ label: "users", value: CategoryType.Users }, { label: "beatmapsets", value: CategoryType.Beatmapsets }] },
        { label: "max nominations", key: "maxNominations", type: "number" },
    ] as InputField[];

    filterFields = [
        { label: "min Length (seconds)", key: "minLength", type: "number" },
        { label: "max Length (seconds)", key: "maxLength", type: "number" },
        { label: "min BPM", key: "minBPM", type: "number" },
        { label: "max BPM", key: "maxBPM", type: "number" },
        { label: "min SR", key: "minSR", type: "number" },
        { label: "max SR", key: "maxSR", type: "number" },
        { label: "min CS", key: "minCS", type: "number" },
        { label: "max CS", key: "maxCS", type: "number" },
    ] as InputField[];

    get isBeatmapsetType () {
        return this.category?.type === CategoryType.Beatmapsets;
    }

    get isUsersType () {
        return this.category?.type === CategoryType.Users;
    }

    async save () {
        let request;
        const postData = {
            category: this.category,
            filter: this.filterParams,
            mode: this.modeSync,
        };

        if (this.infoSync)
            request = this.$axios.put(`/api/admin/years/${this.$route.params.adminYear}/categories/${this.infoSync.id}`, postData);
        else
            request = this.$axios.post(`/api/admin/years/${this.$route.params.adminYear}/categories`, postData);

        const { data } = await request;

        if (!data.success) {
            alert(data.error);
            return;
        }

        this.$emit("updateCategory");
    }
        
}
</script>
