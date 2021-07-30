<template>
    <span class="staff-user">
        <a
            v-if="avatarLocation === 'left'"
            :href="`https://osu.ppy.sh/users/${userId}`"
            target="_blank"
        >
            <img
                :src="`https://a.ppy.sh/${userId}`"
                class="staff-user__avatar"
                :class="small ? 'staff-user__avatar--small' : ''"
            >
        </a>
        <a
            :href="`https://osu.ppy.sh/users/${userId}`"
            target="_blank"
            class="staff-user__link"
            :class="small ? 'staff-user__link--small' : ''"
        >
            {{ username }}
        </a>
        <a
            v-if="avatarLocation === 'right'"
            :href="`https://osu.ppy.sh/users/${userId}`"
            target="_blank"
        >
            <img
                :src="`https://a.ppy.sh/${userId}`"
                class="staff-user__avatar"
                :class="small ? 'staff-user__avatar--small' : ''"
            >
        </a>
    </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";

type Location = "left" | "right";

@Component
export default class UserAvatar extends Vue {
    @Prop({ type: String, default: "right"}) readonly avatarLocation!: Location;
    @Prop({ type: String, required: true }) readonly userId!: string;
    @Prop({ type: String, required: true }) readonly username!: string;
    @Prop({ type: Boolean, default: false }) readonly small!: boolean;
}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-user {
    display: flex;
    align-items: center;

    &__link {
        margin: 5px 0;
        font-weight: bold;
        &--small {
            font-weight: normal;
            font-size: $font-sm;
        }
    }

    &__avatar {
        position: relative;
        top: 0.1em;
        border-radius: 100%;
        max-height: 1.6em;
        margin: 0 0.5em;
        &--small {
            max-height: 1em;
            margin: 0 0.25em;
        }
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
    }
}
</style>
