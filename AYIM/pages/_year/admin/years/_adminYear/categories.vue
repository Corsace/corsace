<template>
    <div>
        <mode-switcher :hide-phase="true">
            <admin-categories />
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserMCAInfo } from "../../../../../../Interfaces/user";

import AdminCategories from "../../../../../../MCA-AYIM/components/admin/AdminCategories.vue";

@Component({
    components: {
        AdminCategories,
    },
    head () {
        return {
            title: "Admin - Categories | AYIM",
        };
    },
})
export default class Years extends Vue {
    @State loggedInUser!: UserMCAInfo;

    async mounted () {
        if (!(this.loggedInUser?.staff?.corsace || this.loggedInUser?.staff?.headStaff))
            this.$router.replace("/");
    }
}
</script>
