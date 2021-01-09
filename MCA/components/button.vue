<template>
    <div 
        class="button"
        @click="$emit('emit')"
    >
        {{ option.toUpperCase() }}
    </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: {
        option: {
            type: String,
            required: true,
        },
    },
});
</script>

<style lang="scss">


.button {
    color: white;
    padding: 13px;

    background-color: black;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.63);

    border-radius: 5.5px;

    margin-right: 25px;

    font-size: 1.5rem;
    text-shadow: 0 0 4px white;
    
    width: 15%;
    min-width: 165px;
    display: flex;
    align-items: center;
    justify-content: center;

    word-wrap: none;

    cursor: pointer;
}
</style>