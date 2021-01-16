<template>
    <div>
        <base-modal title="Access Request">
            <guest-difficulty-submission @submit="submit($event)" />

            <div
                v-if="currentRequests.length"
                class="current-requests"
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
                        :url="generateUrl(request)"
                        :selected-mode="request.mode.name"
                        @submit="update($event, request.ID)"
                    />
                    {{ getStatusName(request.status) }}
                </div>
            </div>
        </base-modal>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Action, Getter, State } from "vuex-class";

import BaseModal from "./BaseModal.vue";
import GuestDifficultySubmission from "./GuestDifficultySubmission.vue";

import { GuestRequest, RequestStatus } from "../../Interfaces/guestRequests";
import { Phase } from "../../Interfaces/mca";
import { UserMCAInfo } from "../../Interfaces/user";

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

    @State modes!: string[];
    @State loggedInUser!: UserMCAInfo;
    @State phase!: Phase;
    @Getter inactiveModes!: string[];
    @Action updateGuestRequest;
    @Action submitGuestRequest;

    get currentRequests (): GuestRequest[] {
        return this.loggedInUser.guestRequests || [];
    }

    generateUrl (request: GuestRequest) {
        return `https://osu.ppy.sh/beatmapsets/${request.beatmap.beatmapsetID}#${request.beatmap.mode.name}/${request.beatmap.ID}`;
    }

    getStatusName (status: RequestStatus) {
        return RequestStatus[status];
    }

    async submit (data: RequestData) {
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

}
</script>
