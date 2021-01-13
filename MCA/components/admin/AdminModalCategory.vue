<template>
    <div class="adminPopout">
        <div class="adminPopout__section">
            name
            <input 
                v-model="name"
                class="adminPopout__input"
            >
        </div>
        <div class="adminPopout__section">
            description
            <input 
                v-model="description"
                class="adminPopout__input"
            >
        </div>
        <div class="adminPopout__section"> 
            <div>
                type
                <select v-model="type">
                    <option :value="'users'">
                        users
                    </option>
                    <option :value="'beatmapsets'">
                        beatmaps
                    </option>
                </select>
            </div>
        </div>
        <div class="adminPopout__section">
            max nominations
            <input 
                v-model.number="maxNominations"
                class="adminPopout__input"
            >
        </div>
        <div class="adminPopout__section">
            isRequired
            <select v-model="isRequired">
                <option :value="true">
                    yes
                </option>
                <option :value="false">
                    no
                </option>
            </select>
        </div>
        <div class="adminPopout__section">
            needs requiresVetting
            <select v-model="requiresVetting">
                <option :value="true">
                    yes
                </option>
                <option :value="false">
                    no
                </option>
            </select>
        </div>
        <div 
            v-if="type === 'beatmapsets'"
            class="adminPopout__section"
        >
            auto filters
            <select v-model="filter">
                <option :value="true">
                    yes
                </option>
                <option :value="false">
                    no
                </option>
            </select>
        </div>
        <div 
            v-else-if="type === 'users'"
            class="adminPopout__section"
        >
            rookie
            <select v-model="rookie">
                <option :value="true">
                    yes
                </option>
                <option :value="false">
                    no
                </option>
            </select>
        </div>
        <div v-if="filter && type === 'beatmapsets' && filterParams">
            <div class="adminPopout__section">
                min Length (seconds)
                <input 
                    v-model="filterParams.minLength"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                max Length (seconds)
                <input 
                    v-model="filterParams.maxLength"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                min BPM
                <input 
                    v-model="filterParams.minBPM"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                max BPM
                <input 
                    v-model="filterParams.maxBPM"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                min SR
                <input 
                    v-model="filterParams.minSR"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                maxSR
                <input 
                    v-model="filterParams.maxSR"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                min CS
                <input 
                    v-model="filterParams.minCS"
                    class="adminPopout__input"
                >
            </div>
            <div class="adminPopout__section">
                max CS
                <input 
                    v-model="filterParams.maxCS"
                    class="adminPopout__input"
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
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";
import axios from "axios";

import { CategoryFilter, CategoryInfo } from "../../../interfaces/category";

@Component
export default class AdminModalCategory extends Vue {

    @Prop({ type: Object, default: () => null }) readonly info!: CategoryInfo | null;
    @Prop({ type: Number, required: true }) readonly year!: number;

    @State selectedMode!: string;
    
    name = "";
    description = "";
    type = "beatmapsets";
    maxNominations = 3;
    isRequired = false;
    requiresVetting = false;
    rookie = false;
    filter = false;
    filterParams: CategoryFilter | null = null;

    updated () {
        if (this.info) {
            this.name = this.info.name;
            this.description = this.info.description;
            this.type = this.info.type;
            this.maxNominations = this.info.maxNominations;
            this.isRequired = this.info.isRequired;
            this.requiresVetting = this.info.requiresVetting;
            this.rookie = this.info.filter?.rookie ? true : false;
            this.filter = this.info.filter ? true : false;
            this.filterParams = (this.filter && this.info.filter) ? this.info.filter : null;
        }
    }

    async save () {
        const { data } = await axios.post("/api/admin/categories/create", {
            categoryInfo: {
                name: this.name,
                description: this.description,
                type: this.type,
                maxNominations: this.maxNominations,
                isRequired: this.isRequired,
                requiresVetting: this.requiresVetting,
                rookie: this.rookie,
                filter: this.filterParams,
            },
            year: this.year,
            mode: this.selectedMode,
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        console.log(data);

        this.$emit("updateCategory");
    }
        
}
</script>
