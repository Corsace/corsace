<template>
    <div class="adminPopout">
        <div class="adminPopout__section">
            year
            <input 
                v-model.number="year"
                class="adminPopout__input"
            >
        </div>
        <div class="adminPopout__section"> 
            <div>
                nomination start
                <input 
                    v-model.trim="nominationStart"
                    class="adminPopout__input"
                >
            </div>
            <div>
                nomination end
                <input 
                    v-model.trim="nominationEnd"
                    class="adminPopout__input"
                >
            </div>
        </div>
        <div class="adminPopout__section">
            <div>
                voting start
                <input 
                    v-model.trim="votingStart"
                    class="adminPopout__input"
                >
            </div>
            <div>
                voting end
                <input 
                    v-model.trim="votingEnd"
                    class="adminPopout__input"
                >
            </div>
        </div>
        <div class="adminPopout__section">
            results time
            <input 
                v-model.trim="results"
                class="adminPopout__input"
            >
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
import axios from "axios";

import { MCAInfo } from "../../../Interfaces/mca";

@Component
export default class AdminModalYear extends Vue {

    @Prop({ type: Object, default: () => null }) readonly info!: MCAInfo | null;
        
    date = new Date;
    year = this.date.getUTCFullYear() - 1;
    nominationStart = this.date.toDateString().slice(4);
    nominationEnd = new Date(this.date.getTime() + 6.048e+8).toDateString().slice(4);
    votingStart = new Date(this.date.getTime() + 2 * 6.048e+8).toDateString().slice(4);
    votingEnd = new Date(this.date.getTime() + 4 * 6.048e+8).toDateString().slice(4);
    results = new Date(this.date.getTime() + 5 * 6.048e+8).toDateString().slice(4);

    mounted () {
        if (this.info &&
            this.info.name && 
            this.info.nomination.start && 
            this.info.nomination.end && 
            this.info.voting.start && 
            this.info.voting.end && 
            this.info.results
        ) {
            this.year = this.info.name;
            this.nominationStart = this.info.nomination.start.toDateString().slice(4);
            this.nominationEnd = this.info.nomination.end.toDateString().slice(4);
            this.votingStart = this.info.voting.start.toDateString().slice(4);
            this.votingEnd = this.info.voting.end.toDateString().slice(4);
            this.results = this.info.results.toDateString().slice(4);
        }
    }

    async save () {
        const { data } = await axios.post("/api/admin/years/create", {
            year: this.year,
            nominationStart: new Date(this.nominationStart + "UTC"),
            nominationEnd: new Date(this.nominationEnd + "UTC"),
            votingStart: new Date(this.votingStart + "UTC"),
            votingEnd: new Date(this.votingEnd + "UTC"),
            results: new Date(this.results + "UTC"), 
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        this.$emit("updateYear");
    }
        
}
</script>