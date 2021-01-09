<template>
    <div class="choice">
        <a
            v-if="choice.title && choice.artist && choice.hoster"
            class="choice__info"
            :style="bgImg"
            :href="`https://osu.ppy.sh/beatmapsets/${choice.id}`"
            target="_blank"
        >
            <div class="choice__infoTitle">
                {{ choice.title.substring(0, Math.min(18, choice.title.length)) + (choice.title.length > 18 ? "..." : "") }}
            </div>
            <div class="choice__infoArtist">
                {{ choice.artist.substring(0, Math.min(25, choice.artist.length)) + (choice.artist.length > 25 ? "..." : "") }}
            </div>
            <span class="choice__infoHost">
                HOSTED BY | <span class="choice__infoHoster">{{ choice.hoster }}</span>
            </span>
        </a>
        <a
            v-else-if="choice.username && choice.userID"
            class="choice__info"
            :style="bgImg"
            :href="`https://osu.ppy.sh/users/${choice.userID}`"
            target="_blank"
        >
            <div class="choice__infoTitle">
                {{ choice.username }}
            </div>
            <div
                v-if="choice.otherNames.length > 0" 
                class="choice__infoArtist"
            >
                {{ choice.otherNames.join(", ").substring(0, Math.min(25, choice.otherNames.join(", ").length)) + (choice.otherNames.join(", ").length > 25 ? "..." : "") }}
            </div>
            <div 
                v-else
                class="choice__infoArtist"
            >
                --
            </div>
            <span class="choice__infoHost">
                User ID | <span class="choice__infoHoster">{{ choice.userID }}</span>
            </span>
        </a>
        <div 
            class="choice__selection"
            @click="$emit('choose')"
        >
            <div 
                class="choice__selectionBox" 
                :class="{'choice__selectionBox--chosen':choice.chosen}"
            >       
                <img
                    class="choice__selectionCheck"
                    :class="{'choice__selectionCheck--chosen':choice.chosen}"
                    src="../../CorsaceAssets/img/ayim-mca/site/checkmark.png"
                >
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: {
        choice: {
            type: Object,
            default: function () {
                return {};
            },
        },
    },
    computed: {
        bgImg(): any {
            if (this.choice)
                return {"background-image": `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${this.choice.avatar ? this.choice.avatar : `https://assets.ppy.sh/beatmaps/${this.choice.id}/covers/cover.jpg?1560315422`})`};

            return {"background-image": ""};
        },
    },
});
</script>

<style lang="scss">
.choice {
    width: 32%;
    height: 41%;

    border-radius: 10px;
    margin: 0 15px 15px 0;

    background-color: black;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);

    display: flex;

    cursor: pointer;
}

.choice__info {
    flex: 5;

    padding: 15px;
    position: relative;

    border-radius: 10px 0 0 10px;

    background-size: 250%;
    background-position: 34% 30%;

    left: 0;
    top: 0;

    color: white;
    text-decoration: none;

    &Title {
        text-shadow: 0 0 2px white;
        font-weight: bold;
        font-size: 1.5rem;
    }

    &Artist {
        text-shadow: 0 0 4px white;
        font-size: 1.25rem;
    }

    &Hoster {
        text-shadow: 0 0 4px white;
        font-style: italic;
    }
}

.choice__selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;

    position: relative;

    padding-bottom: 4%;

    &Box {
        height: 35px;
        width: 35px;
    
        border: 4px solid rgba(255, 255, 255, 0.3); 
        border-radius: 5px;

        transition: all 0.25s ease-out;
        
        &--chosen {
            border-color: white;
            box-shadow: 0 0 4px white, inset 0 0 4px white;
        }

        position: relative;
    }

    &Check {
        width: 100%;
        height: 100%;

        opacity: 0;

        transition: all 0.25s ease-out;

        &--chosen {
            opacity: 1
        }
    }
}
</style>