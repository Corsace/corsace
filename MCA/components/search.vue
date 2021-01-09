<template>
    <div class="search">
        <div class="search__pre">
            <img 
                class="search__preImage"
                src="../../CorsaceAssets/img/ayim-mca/site/magnifying glass.png"
            >
        </div>
        <input
            v-model="text"
            class="search__input"
            placeholder="search for a beatmap / user"
            maxlength="50"
            @input="emitSearch"
        >
        <searchButton 
            :option="option"
            @emit="emitOption"
        />
        <searchButton 
            :option="selectedOrder"
            @emit="changeOrder"
        />
    </div>    
</template>

<script lang="ts">
import Vue from "vue";

import button from "./button.vue";

export default Vue.extend({
    components: {
        "searchButton": button,
    },
    props: {
        option: {
            type: String,
            required: true,
        },
    },
    data () {
        return {
            text: "",
            order: ["ASC", "DESC"],
            selectedOrder: "ASC",
        };
    },
    methods: {
        changeOrder () {
            let target = "ASC";
            for (const option of this.order) {
                if (option === this.selectedOrder) {
                    const index = this.order.indexOf(option);
                    if (index !== this.order.length-1) {
                        target = this.order[index+1];
                    }
                }
            }
            this.selectedOrder = target;

            this.emitSearch();
        },
        emitSearch () {
            this.$emit("search", this.text, this.selectedOrder);
        },
        emitOption () {
            this.$emit("option", this.selectedOrder);
        },
    },
});
</script>

<style lang="scss">
.search {
    display: flex;
}

.search__pre, .search__input {
    color: white;
    padding: 13px;

    background-color: black;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.63);
}

.search__pre {
    border-radius: 5.5px 0 0 5.5px;

    width: 20%;

    display: flex;
    align-items: center;
    justify-content: center;

    &Image {
        width: 35px;
    }

    &::before {
        width: 1px;
        height: 75%;
        background-color: white;
    }
}

.search__input {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 1.5rem;
    letter-spacing: 3px;

    margin-right: 25px;

    border: 0;
    border-radius: 0 5.5px 5.5px 0;

    width: 100%;

    &:focus {
        outline: none;
    }

    &::placeholder, &:placeholder-shown {
        color: rgba(255, 255, 255, 0.26);
        font-style: italic;
    }
}
</style>