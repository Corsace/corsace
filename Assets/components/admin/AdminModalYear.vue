<template>
    <base-modal @close="$emit('cancel')">
        <div class="admin-popout">
            <admin-inputs
                v-model="mcaInfo"
                :fields="fields"
            />
        
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
import AdminInputs, { InputField } from "./AdminInputs.vue";

import { MCAInfo } from "../../../Interfaces/mca";

@Component({
    components: {
        BaseModal,
        AdminInputs,
    },
})
export default class AdminModalYear extends Vue {

    @PropSync("info", { type: Object, default: () => null }) readonly infoSync!: MCAInfo | null;
        
    @Watch("info", { immediate: true })
    onInfoChanged (info: MCAInfo | null) {
        let now = new Date();
        this.mcaInfo = {
            year: info?.name ?? now.getUTCFullYear() - 1,
            nominationStart: this.formatDate(info?.nomination.start ?? now),
            nominationEnd: this.formatDate(info?.nomination.end ?? this.addWeeks(now)),
            votingStart: this.formatDate(info?.voting.start ?? this.addWeeks(now, 2)),
            votingEnd: this.formatDate(info?.voting.end ?? this.addWeeks(now, 4)),
            results: this.formatDate(info?.results ?? this.addWeeks(now, 5)),
        };
    }

    mcaInfo = {};

    fields = [
        { label: "year", key: "year", type: "number" },
        { label: "nomination start", key: "nominationStart", type: "datetime-local" },
        { label: "nomination end", key: "nominationEnd", type: "datetime-local" },
        { label: "voting start", key: "votingStart", type: "datetime-local" },
        { label: "voting end", key: "votingEnd", type: "datetime-local" },
        { label: "results time", key: "results", type: "datetime-local" },
    ] as InputField[];

    async save () {
        let request;

        if (this.infoSync) {
            request = this.$axios.put(`/api/admin/years/${this.infoSync.name}`, this.mcaInfo);
        } else
            request = this.$axios.post("/api/admin/years", this.mcaInfo);

        const { data } = await request;

        if (!data.success) {
            alert(data.error);
            return;
        }

        this.$emit("updateYear");
    }

    addWeeks (date: Date, weeks = 1) {
        const newDate = date;
        newDate.setDate(newDate.getDate() + (7 * weeks));

        return newDate;
    }

    formatDate (originalDate: string | Date): string {
        const date = new Date(originalDate);
        const month = this.formatValue(date.getMonth() + 1);
        const day = this.formatValue(date.getDate());
        const hours = this.formatValue(date.getHours());
        const minutes = this.formatValue(date.getMinutes());

        return `${date.getFullYear()}-${month}-${day}T${hours}:${minutes}`;
    }
    
    formatValue (value: number): number | string {
        if (value < 10)
            return "0" + value;

        return value;
    }
        
}
</script>
