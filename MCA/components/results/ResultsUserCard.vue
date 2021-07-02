<template>
    <div class="user-container">
        <div class="user">
            <a
                class="user-info"
                :href="`https://osu.ppy.sh/users/${choice.userID}`"
                target="_blank"
            >
                <div 
                    class="user-info__avatar"
                    :style="userAva"
                />
                <span class="user-info__place">{{ choice.placement }}</span>
                <span class="user-info__username">{{ choice.username }}</span>
                <span class="user-info__votes">{{ choice.votes }}</span>
                <span class="user-info__vote-right" />
            </a>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class ResultsUserCard extends Vue {
    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    get userAva (): any {
        if (this.choice)
            return {
                "background-image": `url(${this.choice.avatar})` 
            };

        return { "background-image": "" };
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.user {
    &-container {
        flex: 0 0 auto;
        width: 100%;
    }

    @extend %flex-box;
    padding: 0;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);
    cursor: pointer;
    background-position: 31% 0%;

    @include transition();

    &:hover {
        box-shadow: 0 0 12px rgba(255,255,255,0.75);
    }

}

.user-info {
    position: relative;

    display: flex;

    padding: 0 15px;
    border-radius: 10px;
    width: 100%;

    background-repeat: no-repeat;

    overflow: hidden;

    color: white;
    text-decoration: none;

    & > span {
        margin: 15px 0;
    }

    &__avatar {
        position: absolute;

        width: 100%;
        height: 100%;

        z-index: -100;

        background-size: 28%;
        background-position: 8% 52%;
        mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 6%,  rgba(0, 0, 0, 0.7) 10.5%, rgba(0, 0, 0, 0.7) 23%, rgba(0, 0, 0, 0) 33%);
        @include breakpoint(tablet) {
            background-size: 23%;
            background-position: 3% 52%;
            mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 4%,  rgba(0, 0, 0, 0.7) 7.5%, rgba(0, 0, 0, 0.7) 18%, rgba(0, 0, 0, 0) 21%);
        }
    }

    &__place {
        flex: 4;
        text-shadow: 0 0 4px white;
        font-size: $font-lg;
        @extend %text-wrap;
    }

    &__username {
        flex: 6;
        text-shadow: 0 0 4px rgba(255,255,255,0.6);
        font-size: $font-lg;
        @extend %text-wrap;

        @include breakpoint(tablet) {
            flex: 12;
        }
    }

    &__votes {
        display: flex;
        align-content: center;
        justify-content: center;

        text-shadow: 0 0 4px white;
        font-size: $font-lg;

        flex: 1.5;
        @extend %text-wrap;
    }

    &__vote-right {
        flex: 0.5;
    }
}
</style>