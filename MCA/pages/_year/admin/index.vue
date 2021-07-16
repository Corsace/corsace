<template>
    <div class="admin-page">
        <nuxt-link
            :to="`/${$route.params.year}/admin/years`"
            class="admin-page__link"
        >
            Years >
        </nuxt-link>
        <div
            class="admin-page__reset"
            @click="resetCache"
        >
            Reset Cache
        </div>
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

    async resetCache () {
        if (!confirm("Are you sure you want to reset the cache for MCA?"))
            return;
        
        const { data } = await this.$axios.get(`/api/admin/reset`);
        
        if (data.error)
            alert(data.error);
        else if (data.success)
            alert(data.success);
        else {
            alert("Yo check console");
            console.log(data);
        }

    }
}
</script>
