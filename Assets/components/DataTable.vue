<template>
    <div class="table-container">
        <table 
            class="table"
            :class="`table--${viewTheme}`"
        >
            <thead>
                <tr>
                    <th
                        v-for="header in formattedHeaders"
                        :key="header.key"
                    >
                        {{ header.label }}
                    </th>
                    <th v-if="$scopedSlots.actions">
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(item, i) in itemsSync"
                    :key="'item-' + i"
                >
                    <td
                        v-for="(formattedValues, j) in formatItem(item)"
                        :key="'value-' + j"
                    >
                        <slot
                            v-if="$scopedSlots['cell-' + formattedValues.header]"
                            :name="'cell-' + formattedValues.header"
                            :value="formattedValues.value"
                            :item="item"
                        />
                        <span v-else>{{ formattedValues.value }}</span>
                    </td>

                    <td
                        v-if="$scopedSlots.actions"
                        class="table__actions"
                    >
                        <slot
                            name="actions"
                            :item="item"
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { State } from "vuex-class";

export enum Format {
    DateTimeString
}

export interface Field {
    key: string;
    label: string;
    formatter?: ((value: any) => string) | Format;
}

@Component
export default class DataTable extends Vue {

    @State viewTheme!: "light" | "dark";
    
    @PropSync("fields",{ type: Array, default: () => [] }) readonly fieldsSync!: (Field | string)[];
    @PropSync("items", { type: Array, required: true }) readonly itemsSync!: any[];

    get formattedHeaders (): Field[] {
        if (this.fieldsSync.length) {
            return this.fieldsSync.map(f => {
                if (typeof f === "string") {
                    return {
                        key: f,
                        label: f,
                    };
                }

                let formatter = f.formatter;

                if (formatter === Format.DateTimeString) {
                    formatter = (value) => {
                        if (!value) return "";

                        return  new Date(value).toLocaleString("en-US", { month: "long", day: "numeric", hour: "numeric" });
                    };
                }

                return {
                    key: f.key,
                    label: f.label || f.key,
                    formatter,
                };
            });
        }

        if (this.itemsSync.length) {
            return Object.keys(this.itemsSync[0]).map(k => ({
                key: k,
                label: k,
            }));
        }

        return [];
    }

    formatItem (item: any) {
        return this.formattedHeaders.map(h => {
            const keys = h.key.split(".");
            let value = item;

            for (const key of keys) {
                value = value[key];
            }

            if (h.formatter) {
                value = h.formatter(value);
            }

            return {
                header: h.key,
                value,
            };
        });
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.table {
    border-collapse: collapse;
    width: 100%;

    & th, td {
        padding: .5rem;
        border-width: 1px;
    }

    &-container {
        overflow-x: auto;
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.25rem;
    }

    &--light {
        border-color: black;
        color: black;
    }
    &--dark {
        border-color: white;
        color: white;
    }
}

tbody, td, tfoot, th, thead, tr {
    border-color: inherit;
    border-style: solid;
    border-width: 0;
}

</style>
