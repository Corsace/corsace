<template>
    <div>
        <nuxt-link
            :to="`/${$route.params.year}/admin/years`"
            class="admin-page__link"
        >
            Years >
        </nuxt-link>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserMCAInfo } from "../../../../Interfaces/user";

@Component({
    head () {
        return {
            title: "Admin | MCA",
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
