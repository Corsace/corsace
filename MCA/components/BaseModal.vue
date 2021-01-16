<template>
    <div class="login">
        <div class="">
            <div class="login__title">
                {{ title }}
            </div>
            <a
                href="#"
                class="login__close"
                @click="$emit('close')"
            >
                x
            </a>
        </div>
        
        <slot />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class BaseModal extends Vue {

    @Prop({ type: String, default: "" }) readonly title!: string;

}
</script>
