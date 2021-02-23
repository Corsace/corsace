<template>
    <div>Test</div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";
import { UserInfo } from "../../Interfaces/user";

@Component({})
export default class Default extends Vue {

    @State loggedInUser!: UserInfo;

    async mounted () {
        await this.$store.dispatch("setInitialData");
    }
    
}
</script>