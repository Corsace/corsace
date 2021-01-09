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
                v-model="desc"
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
                v-model.number="nomCount"
                class="adminPopout__input"
            >
        </div>
        <div class="adminPopout__section">
            required
            <select v-model="required">
                <option :value="true">
                    yes
                </option>
                <option :value="false">
                    no
                </option>
            </select>
        </div>
        <div class="adminPopout__section">
            needs vetting
            <select v-model="vetting">
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
        <div v-if="filter && type === 'beatmapsets'">
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
        return {
            init: {},
            name: "",
            desc: "",
            type: "beatmapsets",
            nomCount: 3,
            required: false,
            vetting: false,
            rookie: false,
            filter: false,
            filterParams: {},
        };
    },
    updated () {
        if (!_.isEqual(this.info, this.init)) {
            this.name = this.info.name;
            this.desc = this.info.desc;
            this.type = this.info.type;
            this.nomCount = this.info.nomCount;
            this.required = this.info.required;
            this.vetting = this.info.vetting;
            this.rookie = this.info.rookie ?? false;
            this.filter = this.info.filter ? true : false;
            this.filterParams = this.filter ? this.info.filter : {};
        }
    },
    methods: {
        send() {
            this.$emit("send", {
                name: this.name,
                desc: this.desc,
                type: this.type,
                nomCount: this.nomCount,
                required: this.required,
                vetting: this.vetting,
                rookie: this.rookie,
                filter: this.filterParams,
            });
        },
    },
});
</script>