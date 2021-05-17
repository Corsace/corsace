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

@Component({
    head () {
        return {
            title: "Admin | MCA",
        };
    },
})
export default class Years extends Vue {
    
}
</script>
