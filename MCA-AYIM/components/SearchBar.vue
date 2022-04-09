<template>
    <div class="search-bar">
        <div class="search">
            <div class="search__pre">
                <svg
                    class="search__pre-image"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
            </div>
            <input
                class="search__input"
                :class="{ 'search__input--disabled': disabled }"
                :disabled="disabled"
                :placeholder="placeholder"
                maxlength="50"
                @input="updateText($event)"
            >
            
            <div 
                v-if="showActions"
                class="search__actions"
            >
                <slot />
            </div>
        </div>
    </div>    
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import _ from "lodash";

@Component
export default class SearchBar extends Vue {

    // SearchBar requires a key to reactively render div.search-adj
    // this is necessary if it is possible for the SearchBar's slot to be empty 

    @Prop({ type: String, required: true }) readonly placeholder!: string;
    @Prop({ type: Boolean, default: false }) readonly disabled!: boolean;

    showActions = false;

    updateText (e) {
        this.debounce(e.target.value);
    }
    
    // Vue doesnt allow using debounce inside methods, so no idea how this stuff below works, but works Ok
    mounted () {
        this.emitUpdate = _.debounce(this.emitUpdate, 500);
        this.$nextTick(() => {
            this.showActions = !!this.$slots.default;
        });
    }

    debounce (text){
        this.emitUpdate(text);
    }

    emitUpdate (text) {
        this.$emit("update:search", text);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.search-bar {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 100%;
}

.search {
    display: flex;
    flex: 10;
    min-width: 9rem; // any less and magnifying glass exits container
    color: $blue;
    background-color: white;
    border: 2px solid $blue;

    &__pre {
        display: flex;
        align-items: center;
        justify-content: center;

        min-width: 50px;
        
        @include breakpoint(mobile) {
            width: 17px;
        }

        &-image {
            width: 20px;
            height: 20px;
            background-size: 1rem 1rem;
            color: $blue;
            font-size: $font-xl;
        }
    }

    &__input {
        flex: 1;
        font-size: $font-lg;
        @include breakpoint(mobile) {
            font-size: $font-base;
        }

        border: 0;
        border-radius: 0 5.5px 5.5px 0;

        width: 100%;
        margin-left: 0px;

        &:focus {
            outline: none;
        }

        &::placeholder, &:placeholder-shown {
            color: rgba(255, 255, 255, 0.26);
            font-style: italic;
        }

        &--disabled {
            cursor: not-allowed;
        }
    }

    &__actions {
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        & > * {
            padding: 5px;
            margin: 5px;
        }
    }
}
</style>
