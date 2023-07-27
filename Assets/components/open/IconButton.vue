<template>
    <a 
        :href="linkSync"
        :target="externalSync ? '_blank' : '_self'"
        class="content_button"
    >
        <div class="content_button_text">
            <slot />
        </div>
    </a>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component({
    components: {
    },
})

export default class IconButton extends Vue {
    @PropSync("link", { type: String, default: "#" }) linkSync!: string;
    @PropSync("external", { type: Boolean, default: false }) externalSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.content_button {
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    background-color: #545454;
    color: #FFFFFF;
    margin: 15px 0px 15px 0px;
    min-height: 30px;
    padding: 5px;
}
</style>