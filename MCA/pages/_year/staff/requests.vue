<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Requests
        </div>

        <div class="staff-filters">
            <button
                v-if="!showValidated"
                class="button req-filter-btn"
                @click="showValidated = true"
            >
                Show Validated
            </button>
            <button
                v-else
                class="button req-filter-btn"
                @click="showValidated = false"
            >
                Hide Validated
            </button>
        </div>

        <div class="staff-container">
            <div class="staff-container staff-scrollTrack">
                <div class="staff-request__box">
                    <div
                        v-for="request in requests"
                        :key="request.ID"
                    >
                        <div 
                            v-if="showValidated || (!showValidated && getStatusName(request.status) === 'Pending')"
                            class="staff-request"
                        >
                            <div class="staff-request__info">
                                <user-avatar
                                    avatar-location="left"
                                    :user-id="request.userID"
                                    :username="request.username"
                                />

                                <a
                                    :href="generateUrl(request)"
                                    target="_blank"
                                    class="staff-page__link staff-request__link"
                                    :class="`staff-page__link--${request.modeName}`"
                                >
                                    {{ request.artist }} - {{ request.title }} [{{ request.difficulty }}]
                                </a>
                            </div>

                            <div
                                class="staff-request__status"
                                :class="`staff-request__status--${getStatusName(request.status).toLowerCase()}`"
                            >
                                {{ getStatusName(request.status) }}
                            </div>

                            <div class="staff-list__actions">
                                <button
                                    class="button button--small staff-list__action"
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
import UserAvatar from "../../../components/staff/UserAvatar.vue";

import { StaffGuestRequest, RequestStatus } from "../../../../Interfaces/guestRequests";
import { UpdateRequestData } from "../../../store/staff";

const staffModule = namespace("staff");

@Component({
    components: {
        ChoiceBeatmapsetCard,
        ScrollBar,
        UserAvatar,
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

$icon-size: 45px;
$icon-margin: 15px;

.req-filter-btn {
    flex: 1;
    padding: 9.5px;
}

.staff-request {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: $font-base;

    &__box {
        @extend %flex-box;
        flex-direction: column;
    }

    &__info {
        flex: 2;
        display: flex;
        justify-content: space-evenly;
    }

    &__link {
        text-align: right;
        font-size: $font-base;
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
}

</style>
