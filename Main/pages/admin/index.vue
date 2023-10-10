<template>
    <div 
        class="admin"
        :class="`admin--${viewTheme}`"
    >
        <nuxt-link
            :to="`/admin/years`"
            class="admin__button admin__link button"
            :class="`admin--${viewTheme}`"
        >
            Years >
        </nuxt-link>

        <nuxt-link
            class="admin__button admin__link admin__add button"
            to="/"
        >
            home
        </nuxt-link>
    
        <a
            class="admin__reset admin__button admin__link button"
            @click="resetCache"
        >
            Reset Cache
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserInfo } from "../../../Interfaces/user";

@Component({
    head () {
        return {
            title: "Admin",
        };
    },
})
export default class Years extends Vue {
    @State loggedInUser!: UserInfo;
    @State viewTheme!: "light" | "dark";

    async mounted () {
        if (!(this.loggedInUser?.staff?.corsace || this.loggedInUser?.staff?.headStaff))
            await this.$router.replace("/");
    }

    async resetCache () {
        if (!confirm("Are you sure you want to reset the cache for MCA?"))
            return;
        
        const { data } = await this.$axios.get(`/api/admin/reset`);
        
        if (data.success)
            alert(data.success);
        else {
            alert("Yo check console");
            console.log(data);
        }

    }
}
</script>
