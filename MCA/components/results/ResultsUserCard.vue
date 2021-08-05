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
                <span
                    v-for="(col, i) in columns"
                    :key="i"
                    :class="[
                        col.name ? `user-info__${col.name}` : `user-info__${col.label}`,
                        { 'user-info__centred': col.centred }, 
                        { 'user-info__prio': col.prio }
                    ]"
                    :style="{'flex': `${mobile && col.msize ? col.msize : col.size}`}"
                >
                    {{ col.label ? choice[col.label] : "" }}
                </span>
            </a>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { UserResult, ResultColumn } from "../../../Interfaces/result";

@Component
export default class ResultsUserCard extends Vue {
    @Prop({ type: Object, default: () => ({}) }) readonly choice!: UserResult;
    @Prop({ type: Array, required: false }) columns!: ResultColumn[];
    @Prop({ type: Boolean, default: false }) readonly mobile!: boolean;

    get userAva (): any {
        if (this.choice)
            return {
                "background-image": `url(${this.choice.avatar})`, 
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
    align-content: center;

    padding: 0 15px;
    border-radius: 10px;
    width: 100%;

    background-repeat: no-repeat;

    color: white;
    text-shadow: 0 0 4px rgba(255,255,255,0.6);
    font-size: $font-lg;
    text-decoration: none;

    @extend %text-wrap;

    & > span {
        @extend %text-wrap;
        margin: 10px 0;
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

    &__username {
        font-weight: 500;
    }

    &__centred {
        display: flex;
        justify-content: center;
    }

    &__prio {
        min-width: 3rem;
    }
}
</style>