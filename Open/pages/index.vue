<template>
    <div>
        Corsace Open 2023
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";


import { UserInfo } from "../../Interfaces/user";

@Component({
    components: {
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Default extends Vue {

    @State loggedInUser!: UserInfo;

    get avatarURL (): string  {
        return this.loggedInUser?.osu.avatar || "";
    }

    async mounted () {
        await this.$store.dispatch("setInitialData", "open");
    }
    
}
</script>

<style lang="scss">

</style>