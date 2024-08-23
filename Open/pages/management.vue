<template>
    <div class="management">
        Yo
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { TournamentRoleType } from "../../Interfaces/tournament";
import { OpenStaffInfo } from "../../Interfaces/staff";

const openModule = namespace("open");

@Component({
    components: {},
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament?.description || ""},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament?.description || ""},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament?.description || ""},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Management extends Vue {
    
    @openModule.State staffInfo!: OpenStaffInfo | null;

    mounted () {
        if (!this.staffInfo || !this.staffInfo.userRoles.includes(TournamentRoleType.Organizer)) {
            this.$router.push("/");
            return;
        }
    }
}
</script>

<style lang="scss">
.management {

}
</style>