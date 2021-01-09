<template>
    <modeSwitcher 
        :eligible="eligible"
        :page="'admin'"
        :selected-mode="mode"
        @mode="updateMode"
    />
</template>

<script lang="ts">
import Vue from "vue";

import modeSwitcher from "../components/mode/modeSwitcher.vue";

export default Vue.extend({
    components: {
        "modeSwitcher": modeSwitcher,
    },
    computed: {
        eligible () {
            return this.$parent.$attrs.eligible;
        },
        mode () {
            return this.$parent.$attrs.mode;
        },
        user () {
            return this.$parent.$attrs.user;
        },
    },
    methods: {
        updateMode (val) {
            this.$parent.$emit("mode", val);
        },
    },
});
</script>