<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Requests
        </div>

        <div class="staff-container">
            <div
                v-for="group in groupedRequests"
                :key="group.mode"
                class="staff-container__box"
            >
                <div class="staff-container__title">
                    {{ group.mode }}
                </div>

                <div
                    v-for="request in group.requests"
                    :key="request.ID"
                    class="staff-request"
                >
                    <div class="staff-request__info">
                        <a
                            :href="`https://osu.ppy.sh/users/${request.user.osu.userID}`"
                            target="_blank"
                            class="staff-page__link"
                        >
                            {{ request.user.osu.username }}
                        </a>

                        <a
                            :href="generateUrl(request)"
                            target="_blank"
                            class="staff-page__link"
                        >
                            beatmap link
                        </a>
                    </div>

                    <div
                        class="staff-request__status"
                        :class="`staff-request__status--${getStatusName(request.status).toLowerCase()}`"
                    >
                        {{ getStatusName(request.status) }}
                    </div>

                    <div
                        v-if="isPending(request.status)"
                        class="staff-request__actions"
                    >
                        <button
                            class="button button--small staff-request__action"
                            @click="accept(request.ID)"
                        >
                            accept
                        </button>
                        <button
                            class="button button--small staff-request__action"
                            @click="reject(request.ID)"
                        >
                            reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import ChoiceBeatmapsetCard from "../../components/ChoiceBeatmapsetCard.vue";

import { GuestRequest, RequestStatus } from "../../../Interfaces/guestRequests";
import { UpdateRequestData } from "../../store/staff";

interface GroupedRequest {
    mode: string;
    requests: GuestRequest[];
}

const staffModule = namespace("staff");

@Component({
    components: {
        ChoiceBeatmapsetCard,
    },
})
export default class StaffRequests extends Vue {

    @State modes!: string[];
    @staffModule.State requests!: GuestRequest[];
    @staffModule.Action updateRequest!: (data: UpdateRequestData) => Promise<void>;

    get groupedRequests (): GroupedRequest[] {
        const groups: GroupedRequest[] = [];

        for (const request of this.requests) {
            const i = groups.findIndex(g => g.mode === request.mode.name);

            if (i !== -1) groups[i].requests.push(request);
            else groups.push({
                mode: request.mode.name,
                requests: [request],
            });
        }

        return groups;
    }

    isPending (status: number): boolean {
        return status === RequestStatus.Pending;
    }

    getStatusName (status: number): string {
        return RequestStatus[status];
    }

    generateUrl (request: GuestRequest) {
        return `https://osu.ppy.sh/beatmapsets/${request.beatmap.beatmapsetID}#${request.beatmap.mode.name}/${request.beatmap.ID}`;
    }

    async accept (id: number) {
        await this.updateRequest({ id, status: RequestStatus.Accepted });
    }

    async reject (id: number) {
        await this.updateRequest({ id, status: RequestStatus.Rejected });
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-request {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    &__status {
        &--pending {
            color: violet;
        }

        &--accepted {
            color: $green;
        }

        &--rejected {
            color: $red;
        }
    }

    &__actions {
        display: flex;
    }

    &__action {
        margin: 5px;
    }
}

</style>
