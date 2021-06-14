<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Requests
        </div>

        <button
            v-if="!showValidated"
            @click="showValidated = true"
            class="button"
        >
            Show Validated
        </button>
        <button
            v-else
            @click="showValidated = false"
            class="button"
        >
            Hide Validated
        </button>

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
                    <div 
                        v-if="showValidated || (!showValidated && isPending(request.status))"
                        class="staff-request__info"
                    >
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
                        v-if="showValidated || (!showValidated && isPending(request.status))"
                        class="staff-request__status"
                        :class="`staff-request__status--${getStatusName(request.status).toLowerCase()}`"
                    >
                        {{ getStatusName(request.status) }}
                    </div>

                    <div
                        v-if="showValidated || (!showValidated && isPending(request.status))"
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

import ChoiceBeatmapsetCard from "../../../../MCA-AYIM/components/ChoiceBeatmapsetCard.vue";

import { GuestRequest, RequestStatus } from "../../../../Interfaces/guestRequests";
import { UpdateRequestData } from "../../../store/staff";

interface GroupedRequest {
    mode: string;
    requests: GuestRequest[];
}

const staffModule = namespace("staff");

@Component({
    components: {
        ChoiceBeatmapsetCard,
    },
    head () {
        return {
            title: "GD Requests | Staff | MCA",
        };
    },
})
export default class StaffRequests extends Vue {

    @State modes!: string[];
    @staffModule.State requests!: GuestRequest[];
    @staffModule.Action updateRequest!: (data: UpdateRequestData) => Promise<void>;

    showValidated = true;

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

    &__info {
        flex: 1;
        display: flex;
        justify-content: space-evenly;
    }

    &__status {
        flex: 1;
        display: flex;
        justify-content: center;
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
        flex: 1;
        display: flex;
        justify-content: center;
    }

    &__action {
        margin: 5px;
    }
}

</style>
