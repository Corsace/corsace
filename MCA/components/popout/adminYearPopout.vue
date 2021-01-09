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
        <selectButton 
            :option="'save'"
            @emit="send"
        />
        <selectButton 
            :option="'cancel'"
            @emit="$emit('cancel')"
        />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";

import button from "../button.vue";

export default Vue.extend({
    components: {
        selectButton: button,
    },
    props: {
        info: {
            type: Object,
            default: function () {
                return {};
            },
        },
    },
    data () {
        const date = new Date;

        return {
            init: {},
            year: date.getUTCFullYear()-1,
            nominationStart: date.toDateString().slice(4),
            nominationEnd: new Date(date.getTime() + 6.048e+8).toDateString().slice(4),
            votingStart: new Date(date.getTime() + 2 * 6.048e+8).toDateString().slice(4),
            votingEnd: new Date(date.getTime() + 4 * 6.048e+8).toDateString().slice(4),
            results: new Date(date.getTime() + 5 * 6.048e+8).toDateString().slice(4),
        };
    },
    mounted () {
        if (
            !_.isEqual(this.info, this.init) &&
            this.info.year && 
            this.info.nominationStart && 
            this.info.nominationEnd && 
            this.info.votingStart && 
            this.info.votingEnd && 
            this.info.results
        ) {
            this.year = this.info.year;
            this.nominationStart = this.info.nominationStart.toDateString().slice(4);
            this.nominationEnd = this.info.nominationEnd.toDateString().slice(4);
            this.votingStart = this.info.votingStart.toDateString().slice(4);
            this.votingEnd = this.info.votingEnd.toDateString().slice(4);
            this.results = this.info.results.toDateString().slice(4);
        }
    },
    methods: {
        send() {
            this.$emit("send", {
                year: this.year,
                nominationStart: new Date(this.nominationStart + "UTC"),
                nominationEnd: new Date(this.nominationEnd + "UTC"),
                votingStart: new Date(this.votingStart + "UTC"),
                votingEnd: new Date(this.votingEnd + "UTC"),
                results: new Date(this.results + "UTC"), 
            });
        },
    },
});
</script>