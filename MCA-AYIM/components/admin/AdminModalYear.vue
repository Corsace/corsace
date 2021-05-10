<template>
    <base-modal @close="$emit('cancel')">
        <div class="admin-popout">
            <div class="admin-popout__section">
                year
                <input
                    v-model.number="mcaInfo.year"
                    type="number"
                    class="admin-popout__input"
                    :disabled="info"
                >
            </div>
            <div class="admin-popout__section"> 
                <div>
                    nomination start
                    <input 
                        v-model="mcaInfo.nominationStart"
                        type="datetime-local"
                        class="admin-popout__input"
                    >
                </div>
                <div>
                    nomination end
                    <input 
                        v-model="mcaInfo.nominationEnd"
                        type="datetime-local"
                        class="admin-popout__input"
                    >
                </div>
            </div>
            <div class="admin-popout__section">
                <div>
                    voting start
                    <input 
                        v-model="mcaInfo.votingStart"
                        type="datetime-local"
                        class="admin-popout__input"
                    >
                </div>
                <div>
                    voting end
                    <input 
                        v-model="mcaInfo.votingEnd"
                        type="datetime-local"
                        class="admin-popout__input"
                    >
                </div>
            </div>
            <div class="admin-popout__section">
                <div>
                    results time
                    <input 
                        v-model.trim="mcaInfo.results"
                        type="datetime-local"
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
import { Vue, Component, Prop } from "vue-property-decorator";

import BaseModal from "../BaseModal.vue";

import { MCAInfo } from "../../../Interfaces/mca";

@Component({
    components: {
        BaseModal,
    },
})
export default class AdminModalYear extends Vue {

    @Prop({ type: Object, default: () => null }) readonly info!: MCAInfo | null;
        
    mcaInfo = {}

    mounted () {
        let now = new Date;
        this.mcaInfo = {
            year: this.info?.name || now.getUTCFullYear() - 1,
            nominationStart: this.formatDate(this.info?.nomination.start || now),
            nominationEnd: this.formatDate(this.info?.nomination.end || this.addWeeks(now)),
            votingStart: this.formatDate(this.info?.voting.start || this.addWeeks(now, 2)),
            votingEnd: this.formatDate(this.info?.voting.end || this.addWeeks(now, 4)),
            results: this.formatDate(this.info?.results || this.addWeeks(now, 5)),
        };
    }

    async save () {
        let request: Promise<any>;

        if (this.info) {
            request = this.$axios.put(`/api/admin/years/${this.info.name}`, this.mcaInfo);
        } else {
            request = this.$axios.post("/api/admin/years", this.mcaInfo);
        }

        const { data } = await request;

        if (data.error) {
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
