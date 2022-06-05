<template>
    <div>heyyyy lol</div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import LoginModal from "../../MCA-AYIM/components/header/LoginModal.vue";

import { UserInfo } from "../../Interfaces/user";

@Component({
    components: {
        LoginModal,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Default extends Vue {

    @State loggedInUser!: UserInfo;

    showLoginModal = false;

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar || "";
    }
    
    toogleLoginModal (): void {
        this.showLoginModal = !this.showLoginModal;
    }

    async mounted () {
        await this.$store.dispatch("setInitialData", "open");
    }
    
}
</script>

<style lang="scss">

</style>