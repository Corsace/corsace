<template>
    <span class="staff-user">
        <a
            v-if="avatarLocation === 'left'"
            :href="`https://osu.ppy.sh/users/${user.osuID}`"
            target="_blank"
        >
            <img
                :src="`https://a.ppy.sh/${user.osuID}`"
                class="staff-user__avatar"
                :class="small ? 'staff-user__avatar--small' : ''"
            >
        </a>
        <a
            :href="`https://osu.ppy.sh/users/${user.osuID}`"
            target="_blank"
            class="staff-user__link"
            :class="small ? 'staff-user__link--small' : ''"
        >
            {{ user.osuUsername }}
        </a>
        <a
            v-if="avatarLocation === 'right'"
            :href="`https://osu.ppy.sh/users/${user.osuID}`"
            target="_blank"
        >
            <img
                :src="`https://a.ppy.sh/${user.osuID}`"
                class="staff-user__avatar"
                :class="small ? 'staff-user__avatar--small' : ''"
            >
        </a>
    </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";

@Component
export default class UserAvatar extends Vue {
    @Prop({ type: String, default: "right"}) readonly avatarLocation!: string;
    @Prop({ type: Object, default: false }) readonly user!: Record<string, string>;
    @Prop({ type: Boolean, default: false }) readonly small!: boolean;
}
</script>
