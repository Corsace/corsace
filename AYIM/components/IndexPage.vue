<template>
    <div class="general-info">
        <div class="general-info__text">
            <p>Hello 2020.</p>

            <p>A Year in Mapping has returned for 2019 to bring you etc etc etc</p>

            <p>
                sdasdsadasd<br>
                asdsadsad
            </p>

            <p>
                asdasdsadasdsad<br>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute 
                irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla 
                pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
                deserunt mollit anim id est laborum
            </p>

            <p>Select your preferred mode with the icons below to get started</p>
        </div>
        
        <div class="ayim-nav">
            <nuxt-link
                :to="`/${mca.year}/mapsets/records`"
                class="ayim-nav__item button"
            >
                mapsets
            </nuxt-link>
            <nuxt-link
                :to="`/${mca.year}/mappers/records`"
                class="ayim-nav__item button"
            >
                mappers
            </nuxt-link>
            <nuxt-link
                :to="`/${mca.year}/comments`"
                class="ayim-nav__item button"
            >
                comments
            </nuxt-link>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { MCA } from "../../Interfaces/mca";

@Component
export default class IndexPage extends Vue {

    @State selectedMode!: string;
    @State mca!: MCA;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.general-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 15px 0 0 15px; 
    background-color: $bg-dark; 
    padding: 30px 70px;
    margin-bottom: 30px;
    height: 100%;
}

</style>
