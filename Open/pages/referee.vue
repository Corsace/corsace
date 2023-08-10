<template>
    <div class="referee">
        <OpenTitle>
            {{ $t('open.referee.title') }}
        </OpenTitle>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import { Tournament } from "../../Interfaces/tournament";

const openModule = namespace("open");

@Component({
    components: {
        OpenTitle,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state["open"].tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state["open"].title},
                {name: "twitter:description", content: this.$store.state["open"].tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Referee extends Vue {
    @openModule.State tournament!: Tournament | null;

    async mounted () {
        //
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.referee {
    align-self: center;
    position: relative;
    width: 65vw;
    padding: 35px;
    background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
}

</style>