<template>
    <div>
        <div
            v-for="field in fieldsSync"
            :key="field.key"
            class="admin-popout__section"
        >
            <template v-if="field.type === 'select'">
                {{ field.label }}
                <select
                    v-model="updatedInput[field.key]"
                    class="admin-popout__input"
                >
                    <option
                        v-for="(option, i) in field.options"
                        :key="i"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </template>

            <template v-else>
                {{ field.label }}
                <input
                    v-if="field.type === 'number'"
                    v-model.number="updatedInput[field.key]"
                    :type="field.type || 'text'"
                    class="admin-popout__input"
                >
                <input
                    v-else
                    v-model="updatedInput[field.key]"
                    :type="field.type || 'text'"
                    class="admin-popout__input"
                >
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync, Watch } from "vue-property-decorator";

import BaseModal from "../../../Assets/components/BaseModal.vue";

export interface InputField {
    label: string;
    key: string;
    type: "number" | "checkbox" | "datetime-local" | "text" | "select";
    options?: {
        label: string;
        value: string | number;
    }[];
}

@Component({
    components: {
        BaseModal,
    },
})
export default class AdminInputs extends Vue {

    @PropSync("fields", { type: Array, required: true }) readonly fieldsSync!: InputField[];
    @PropSync("value", { type: Object, default: () => ({}) }) readonly valueSync!: Record<string, any>;

    @Watch("updatedInput", { deep: true })
    onUpdatedInputChanged (updatedInput: Record<string, any>) {
        this.$emit("input", updatedInput);
    }
    
    updatedInput: Record<string, string | number> = {};

    mounted () {
        this.updatedInput = JSON.parse(JSON.stringify(this.valueSync));
    }

}
</script>
