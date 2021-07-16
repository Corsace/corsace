<template>
    <base-modal
        v-if="showGuestDifficultyModal"
        title="Access Request"
        @close="toggleGuestDifficultyModal"
    >
        <div class="column-box">
            <div class="request__title">
                Didn't rank sets but only guest difficulties in {{ $route.params.year }}? <br> Select mode + submit your guest difficulty here (or storyboard for storyboard mode) <br> to be checked by staff and able to nominate / vote for MCA {{ $route.params.year }}
            </div>
            <guest-difficulty-submission @submit="submit($event)" />
        </div>

        <div
            v-if="currentRequests.length"
            class="current-requests column-box"
        >
            <div class="current-requests__title">
                Current requests
            </div>
            <div
                v-for="request in currentRequests"
                :key="request.ID"
                class="current-requests__item"
            >
                <guest-difficulty-submission
                    :status="request.status"
                    :url="generateUrl(request)"
                    :selected-mode="request.mode.name"
                    @submit="update($event, request.ID)"
                />
                
                <span>Status: <b>{{ getStatusName(request.status) }}</b></span>
                <span v-if="isPending(request.status)">
                    - Please check back later
                </span>
                <span v-else-if="wasRejected(request.status)">
                    - Updating makes the request go back to pending state
                </span>
                <div style="border-bottom: 1px solid white" />
            </div>
        </div>
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Action, Mutation, State } from "vuex-class";

import BaseModal from "../../MCA-AYIM/components/BaseModal.vue";
import GuestDifficultySubmission from "./GuestDifficultySubmission.vue";

import { GuestRequest, RequestStatus } from "../../Interfaces/guestRequests";
import { UserMCAInfo } from "../../Interfaces/user";
import { GuestRequestPayload, UpdateGuestRequestPayload } from "../../MCA-AYIM/store";

interface RequestData {
    url: string;
    mode: string;
}

@Component({
    components: {
        BaseModal,
        GuestDifficultySubmission,
    },
})
export default class GuestDifficultyModal extends Vue {

    @State showGuestDifficultyModal!: boolean;
    @Mutation toggleGuestDifficultyModal;

    @State loggedInUser!: UserMCAInfo;
    @Action updateGuestRequest!: (payload: UpdateGuestRequestPayload) => Promise<void>;
    @Action submitGuestRequest!: (payload: GuestRequestPayload) => Promise<void>;

    get currentRequests (): GuestRequest[] {
        return this.loggedInUser.guestRequests || [];
    }

    generateUrl (request: GuestRequest) {
        const mode = request.beatmap.mode.name === "standard" ? "osu" : request.beatmap.mode.name;

        return `https://osu.ppy.sh/beatmapsets/${request.beatmap.beatmapsetID}#${mode}/${request.beatmap.ID}`;
    }

    getStatusName (status: RequestStatus) {
        return RequestStatus[status];
    }

    async submit (data: RequestData) {
        if (!confirm("This form is only to request access if you only ranked guest difficulties and no sets.\n This is not a place to nominate a beatmap.\n Do you understand?"))
            return;

        await this.submitGuestRequest({
            mode: data.mode,
            url: data.url,
        });
    }

    async update (data: RequestData, requestId: number) {
        await this.updateGuestRequest({
            id: requestId,
            mode: data.mode,
            url: data.url,
        });
    }

    isPending (status: RequestStatus) {
        return status === RequestStatus.Pending;
    }

    wasRejected (status: RequestStatus) {
        return status === RequestStatus.Rejected;
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.column-box {
    @extend %box;
    display: flex;
    flex-direction: column;    
}

.current-requests__title, .request__title {
    border-bottom: 1px solid $gray;
}

.current-requests {
    margin-top: 30px;
}

</style>
