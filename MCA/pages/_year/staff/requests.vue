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
            <div class="staff-container staff-scrollTrack">
                <div class="staff-container__box">
                    <div
                        v-for="request in requests"
                        :key="request.ID"
                    >
                        <div 
                            v-if="showValidated || (!showValidated && getStatusName(request.status) === 'Pending')"
                            class="staff-request"
                        >
                            <div class="staff-request__info">
                                <a
                                    :href="`https://osu.ppy.sh/users/${request.userID}`"
                                    target="_blank"
                                    class="staff-page__link"
                                    :class="`staff-page__link--${request.modeName}`"
                                >
                                    {{ request.username }} - {{ request.modeName }}
                                </a>

                                <a
                                    :href="generateUrl(request)"
                                    target="_blank"
                                    class="staff-page__link"
                                    :class="`staff-page__link--${request.modeName}`"
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

                            <div class="staff-request__actions">
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
            <scroll-bar selector=".staff-scrollTrack" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import ChoiceBeatmapsetCard from "../../../../MCA-AYIM/components/ChoiceBeatmapsetCard.vue";
import ScrollBar from "../../../../MCA-AYIM/components/ScrollBar.vue";

import { StaffGuestRequest, RequestStatus } from "../../../../Interfaces/guestRequests";
import { UpdateRequestData } from "../../../store/staff";

const staffModule = namespace("staff");

@Component({
    components: {
        ChoiceBeatmapsetCard,
        ScrollBar,
    },
    head () {
        return {
            title: "GD Requests | Staff | MCA",
        };
    },
})
export default class StaffRequests extends Vue {

    @State modes!: string[];
    @staffModule.State requests!: StaffGuestRequest[];
    @staffModule.Action updateRequest!: (data: UpdateRequestData) => Promise<void>;

    showValidated = true;

    getStatusName (status: number): string {
        return RequestStatus[status];
    }

    generateUrl (request: StaffGuestRequest) {
        return `https://osu.ppy.sh/b/${request.beatmapID}`;
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
