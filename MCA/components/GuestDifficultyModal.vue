<template>
    <div>
        <base-modal>
            hello
        </base-modal>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import BaseModal from "./BaseModal.vue";

@Component({
    components: {
        BaseModal,
    },
})
export default class GuestDifficultyModal extends Vue {

}
</script>
