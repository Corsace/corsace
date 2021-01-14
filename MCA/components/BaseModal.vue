<template>
    <div class="container fixed flex flex-col items-center justify-items-center flex-wrap shadow bg-gray-900 z-50 h-full w-full">
        <div class="flex justify-items-center">
            <h1>{{ title }}</h1>
            <a
                href="#"
                class="justify-self-end"
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
