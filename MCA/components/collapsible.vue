<template>
    <div 
        class="collapsible"
        :class="{'collapsible--active': active}"
        :style="{'overflow-y': scroll ? 'visible' : 'hidden'}"
        @click="!active ? ($emit('activate'), target = {}) : 0"
    >
        {{ title }}
        <hr 
            class="collapsible__Bar"
            :class="`collapsible--${selectedMode}`"
        >
        <div 
            class="collapsible__Items"
            :class="{ collapsible__ItemsExtra: !showExtra }"
        >
            <div
                v-for="(item, i) in list"
                :key="i"
                class="collapsible__Info"
                @click="$emit('target', item); target===item ? 0 : target=item"
            >
                <div 
                    class="collapsible__Name"
                    :class="{'collapsible__Name--active': showExtra && target===item && active}"
                >
                    {{ item.name }} {{ showExtra ? item.maxNominations && !('count' in item) ? "- " + item.maxNominations: "" : "" }}
                </div>
                <hr
                    class="collapsible__InfoBar"
                    :class="[{'collapsible__InfoBar--active': showExtra && target===item && active}, `collapsible--${selectedMode}`]"
                >
                <div
                    v-if="showExtra && 'count' in item && 'maxNominations' in item"
                    class="collapsible__Count"
                    :class="{'collapsible__Count--active': target===item && active}"
                >
                    {{ item.count }}/{{ item.maxNominations }}
                </div>
                <div
                    v-else-if="showExtra && 'type' in item"
                    class="collapsible__Count"
                    :class="{'collapsible__Count--active': target===item && active}"
                >
                    {{ item.type }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

interface SubItem {
    name: string;
    count?: number;
    total?: number;
    type?: string;
    mode?: string;
    [key: string]: any;
}

export default Vue.extend({
    props: {
        selectedMode: {
            type: String,
            default: "standard",
        },
        title: {
            type: String,
            default: "",
        },
        list: {
            type: Array,
            default: function () {
                return [];
            },
        },
        active: Boolean,
        showExtra: Boolean,
        scroll: Boolean,
    },
    data () {
        return {
            target: {} as SubItem,
        };
    },
    mounted () {
        if (this.list.length > 0) {
            this.target = this.list[0] as SubItem;
        }
    },
});
</script>

<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

%half-box {
    background-color: rgba(0, 0, 0, 0.6); 

    border-radius: 7px; 
    margin: 5px 20px;
    padding: 2%;

    flex: 1 1 100%;
    
    @media (min-width: 1200px) {
        flex-wrap: nowrap;
        flex: 1 1 50%;
    }
}

@mixin mode-collapsible {
    @each $mode in $modes {
        &--#{$mode} {
            border: 1px solid var(--#{$mode});
        }
    }
}

.collapsible {
    @extend %half-box;
    font-family: 'Lexend Peta';
    font-size: 2rem;
    letter-spacing: -3px;
    text-align: center;
    color: gray;
    text-shadow: none;
    font-weight: 100;

    white-space: nowrap;

    cursor: pointer;

    height: 66px;
    overflow: hidden;

    transition: all 0.25s ease-out;

    &--active {

        color: white;
        text-shadow: 0 0 8px white;
        height: 425px;
    }

    @include mode-collapsible;

}

.collapsible__Bar {
    right: -25%;
    top: -2px;
    position: relative;

    margin: 0;
    margin-bottom: 15px;

    transition: all 0.25s ease-out;
}

.collapsible__Items {
    position: relative;
    
    &Extra {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
}

.collapsible__Info {
    position: relative;

    display: flex;
    align-items: center;

    padding: 1%;

    &Bar {
        left: 1%;
        right: 0;
        bottom: 0;
        top: 85%;

        width: 0;
        border-width: 0;

        margin: 0;
        margin-bottom: 15px;

        position: absolute;

        transition: all 0.25s ease-out;

        &--active {
            width: 60%;
            border-width: 1px;
        }

    }
}

.collapsible__Name, .collapsible__Count {
    font-size: 1.5rem;
    letter-spacing: initial;
    font-family: 'Red Hat Display';
}

.collapsible__Name {
    text-shadow: none;
    font-weight: 100;

    transition: all 0.25s ease-out;

    &--active {
        text-shadow: 0 0 8px white;
        font-weight: 700;
    }
}

.collapsible__Count {
    width: 14%;
    min-width: fit-content;

    background-color: none;
    color: white;
    text-shadow: none;
    font-weight: 100;
    border: 1px solid white;
    border-radius: 7px;

    padding: 5px 9px;
    margin-left: auto;

    letter-spacing: 2px;

    transition: all 0.25s ease-out;

    &--active {
        background-color: white;
        color: rgba(0, 0, 0, 0.6);
        box-shadow: 0 0 10px white;
    }
}

.collapsible__Scroll {
    height: 350px;

    top: 16%;
}
</style>