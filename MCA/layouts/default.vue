<template>
    <div
        :style="loadingTransition"
        class="main"
    >
        <headerComponent
            :mode="mode"
            :user="user"
            :year="phase.year"
        />
        <transition name="fade">
            <nuxt
                :user="user" 
                :eligible="eligible"
                :mode="mode"
                :phase="phase"
                @mode="updateMode"
            />
        </transition>
        <footerComponent />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";

import header from "../components/header/index.vue";
import footer from "../components/footer/index.vue";

import { UserMCAInfo } from "../../CorsaceModels/user";

export default Vue.extend({
    components: {
        "headerComponent": header,
        "footerComponent": footer,
    },
    data () {
        return {
            loaded: false,
            user: {} as UserMCAInfo,
            phase : {} as any,
            mode: "standard",
        };
    },
    computed: {
        loadingTransition() {
            if (!this.loaded)
                return {
                    opacity: 0,
                };
            else
                return {
                    opacity: 1,
                };
        },
        eligible(): boolean {
            if (this.user.staff?.headStaff)
                return true;

            if (this.user.eligibility)
                for (const eligibility of this.user.eligibility) {
                    if (
                        eligibility.year === (new Date).getUTCFullYear()-1 && 
                        eligibility[this.mode]
                    )
                        return true;
                }
            
            return false;
        },
    },
    mounted: async function () {
        await this.update();

        const localMode = localStorage.getItem("mode");
        if (localMode && /^(standard|taiko|fruits|mania|storyboard)$/.test(localMode))
            this.mode = localMode;

        this.loaded = true;
    },
    methods: {
        async update() {
            try {
                let [data, phase]: [any, any] = await Promise.all([axios.get(`/api/user`), axios.get(`/api/phase`)]);
                data = data.data;
                phase = phase.data;

                if (!data.error)
                    this.user = data.user;

                if (!phase.error)
                {
                    phase.startDate = new Date(phase.startDate);
                    phase.endDate = new Date(phase.endDate);
                    this.phase = phase;
                }
            } catch (err) {
                console.error(err);
            }
        },
        updateMode (val) {
            if (/^(standard|taiko|fruits|mania|storyboard)$/.test(val)) {
                this.mode = val;
                localStorage.setItem("mode", this.mode);
            }
        },
    },
});
</script>

<style lang="scss">

.main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    padding-bottom: 9vh;

    transition: opacity 0.5s ease-out;
}
.fade-enter-active, .fade-leave-active {
    transition: opacity .25s ease-out;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
</style>