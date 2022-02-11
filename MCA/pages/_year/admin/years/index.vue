<template>
    <div>
        <mode-switcher :hide-phase="true">
            <admin-years />
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserMCAInfo } from "../../../../../Interfaces/user";

@Component({
    components: {
    },
    head () {
        return {
            title: "Admin - Years | MCA",
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
