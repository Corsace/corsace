<template>
    <div class="index">
        <video 
            autoplay
            muted
            loop
            class="video"
        >
            <source 
                src="https://cdn.discordapp.com/attachments/461588387854417922/1121109155277721641/output.mp4"
                type="video/mp4"
            >
        </video>
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
@import '@s-sass/_variables';

.index {
    height: 100%;
    width: 100%;
    background: $dark;
}

.video {
    mask-image: linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 5%, rgba(0,0,0,0.5) 10%, rgba(0,0,0,0.25) 20%, rgba(0,0,0,0) 40%);
}
</style>