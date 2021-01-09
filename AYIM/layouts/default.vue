<template>
    <div
        v-if="loaded"
        class="layout"
    >
        <headerComponent 
            :user="user"
        />
        <nuxt 
            :user="user" 
            :eligible="eligible"
        />
        <footerComponent />
    </div>
</template>

<script>
import axios from "axios";

import header from "../components/header/header";
import footer from "../components/footer/footer";

export default {
    components: {
        "headerComponent": header,
        "footerComponent": footer,
    },
    data () {
        return {
            loaded: false,
            user: null,
            eligible: false,
        };
    },
    created: async function () {
        await this.update();
        this.loaded = true;
    },
    methods: {
        update: async function() {
            try {
                const data = (await axios.get(`/api/user`)).data;

                if (!data.error) {
                    this.user = data.user;
                    for (const eligibility of this.user.mcaEligibility) {
                        if (eligibility.year === (new Date).getUTCFullYear) {
                            this.eligible = true;
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
        },
    },
};
</script>

<style lang="scss">

.layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
}

</style>