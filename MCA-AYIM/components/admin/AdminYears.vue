<template>
    <div class="admin">
        <button 
            class="admin__button admin__add button"
            @click="create"
        >
            add
        </button>

        <data-table
            :fields="fields"
            :items="years"
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
        
        <admin-modal-year
            v-if="showYearModal"
            :info="selectedYear"
            @cancel="showYearModal = false"
            @updateYear="updateYear"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import ChoiceBeatmapsetCard from "../ChoiceBeatmapsetCard.vue";
import Collapsible from "../Collapsible.vue";
import ScrollBar from "../ScrollBar.vue";
import AdminModalCategory from "./AdminModalCategory.vue";
import AdminModalYear from "./AdminModalYear.vue";
import DataTable, { Field, Format } from "./DataTable.vue";

import { MCAInfo } from "../../../Interfaces/mca";

@Component({
    components: {
        ChoiceBeatmapsetCard,
        Collapsible,
        ScrollBar,
        AdminModalCategory,
        AdminModalYear,
        DataTable,
    },
})
export default class AdminPage extends Vue {

    showYearModal = false;
    years: MCAInfo[] = [];
    selectedYear: MCAInfo | null = null;
    
    fields: Field[] = [
        { key: "name", label: "Year" },
        { key: "nomination.start", label: "Nominations Start", formatter: Format.DateTimeString },
        { key: "nomination.end", label: "Nominations End", formatter: Format.DateTimeString },
        { key: "voting.start", label: "Voting End", formatter: Format.DateTimeString },
        { key: "voting.end", label: "Voting End", formatter: Format.DateTimeString },
        { key: "results", label: "Results", formatter: Format.DateTimeString },
    ];

    async mounted () {
        await this.getMcaInfo();
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

    create () {
        this.selectedYear = null;
        this.showYearModal = true;
    }

    edit (mcaInfo: MCAInfo) {
        this.selectedYear = mcaInfo;
        this.showYearModal = true;
    }

    async remove (mcaInfo: MCAInfo) {
        if (!confirm(`Are you sure you want to delete ${mcaInfo.name}?`))
            return;

        const { data } = await this.$axios.delete(`/api/admin/years/${mcaInfo.name}/delete`);

        if (data.error) {
            alert(data.error);
            return;
        }

        await this.getMcaInfo();
    }

}
</script>
