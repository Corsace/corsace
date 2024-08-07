<template>
    <BaseModal
        @close="$emit('close', false)"
    >
        <div class="qualifier_modal__row">
            <div class="qualifier_modal__label qualifier_modal__label--no_shadow">
                QUALIFIER DATE/TIME
            </div>
            <div>
                <div 
                    class="qualifier_modal__label--no_shadow"
                    style="text-align: left;"
                >
                    Choose a date and time (IN YOUR LOCAL TIMEZONE {{ timeZone }}) for your team to play their qualifiers. You can change this later if you need to.
                </div>
                <div 
                    class="qualifier_modal__label--no_shadow"
                    style="text-align: right; margin: 25px 0;"
                >
                    Please note that the lobby will start when the captain joins.<br>The captain can leave immediately after the bot selects the first map.
                </div>
                <input 
                    v-model="qualifierAt"
                    type="datetime-local"
                    :max="qualifierStage?.timespan.end.toISOString().slice(0, 16)"
                    :min="qualifierStage?.timespan.start.toISOString().slice(0, 16)"
                    class="team__input"
                >
            </div>
        </div>
        <ContentButton
            v-if="!teamSync?.qualifier"
            class="content_button--red qualifier_modal__label--no_shadow"
            @click.native="registerTeam"
        >
            {{ loading ? "LOADING..." : "REGISTER TEAM TO CORSACE OPEN" }}
        </ContentButton>
        <ContentButton
            v-else
            class="content_button--red qualifier_modal__label--no_shadow"
            @click.native="editQualifier"
        >
            {{ loading ? "LOADING..." : "EDIT QUALIFIER TIME" }}
        </ContentButton>
    </BaseModal>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

import BaseModal from "../BaseModal.vue";
import ContentButton from "./ContentButton.vue";
import { namespace } from "vuex-class";
import { StageType } from "../../../Interfaces/stage";
import { Tournament } from "../../../Interfaces/tournament";
import { Team } from "../../../Interfaces/team";
import { toLocalISOString } from "../../../Server/utils/dateParse";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        BaseModal,
    },
})
export default class QualifierModal extends Vue {
    @PropSync("team", { type: Object, required: true }) teamSync!: Team | null; 

    @openModule.State tournament!: Tournament | null;

    get qualifierStage () {
        return this.tournament?.stages.find(s => s.stageType === StageType.Qualifiers) ?? null;
    }

    get timeZone () {
        const dateString = new Date().toLocaleString("en-US", { timeZoneName: "shortOffset" }).split(" ");
        return dateString[dateString.length - 1];
    }

    qualifierAt = toLocalISOString(new Date()).slice(0, 16);
    loading = false;

    async registerTeam () {
        if (!this.teamSync || this.loading)
            return;

        this.loading = true;
        const date = new Date(this.qualifierAt);
        if (isNaN(date.getTime())) {
            alert("Invalid date/time");
            this.loading = false;
            return;
        }

        if (!confirm(`Are you sure your team wants to play their qualifiers at the UTC time ${date.toUTCString()}?`)) {
            this.loading = false;
            return;
        }

        if (!confirm(`Are you sure you want to register ${this.teamSync.name} to the Corsace Open?\nAny player or captain in this team will not be able to join another team and register for this tournament.\nYour roster is considered set after you play the qualifier.`)) {
            this.loading = false;
            return;
        }

        const { data: res } = await this.$axios.post(`/api/team/${this.teamSync.ID}/register`, {
            tournamentID: this.tournament?.ID,
            qualifierAt: date.getTime(),
        });

        if (!res.success)
            alert(res.error);

        if (res.success && !this.teamSync?.qualifier)
            alert("Your team has been successfully registered to the Corsace Open!\nYou can change your qualifier time whenever you wish before the actual matchup time.");

        this.loading = false;

        if (res.success)
            this.$emit("close", true);
    }

    async editQualifier () {
        if (!this.teamSync || this.loading)
            return;

        this.loading = true;
        let date = new Date(this.qualifierAt);
        if (isNaN(date.getTime())) {
            alert("Invalid date/time");
            this.loading = false;
            return;
        }

        if (this.teamSync.qualifier?.date && date.getTime() === new Date(this.teamSync.qualifier.date).getTime()) {
            alert("You have not changed the qualifier time.");
            this.loading = false;
            return;
        }

        if (date.getTime() < Date.now()) {
            if (!confirm("You are setting the qualifier time to a time in the past. I will automatically change it to the current time. Are you sure you want to do this?")) {
                this.loading = false;
                return;
            }
            date = new Date();
        }

        if (!confirm(`Are you sure your team wants to now play their qualifiers at the UTC time ${date.toUTCString()}?`)) {
            this.loading = false;
            return;
        }

        const { data: res } = await this.$axios.post(`/api/team/${this.teamSync.ID}/qualifier`, {
            tournamentID: this.tournament?.ID,
            qualifierAt: date.getTime(),
        });
        
        if (!res.success)
            alert(res.error);

        this.loading = false;
        
        if (res.success)
            this.$emit("close", true);
    }
}

</script>

<style lang="scss">
.qualifier_modal {

    &__row {
        display: flex;
        margin-bottom: 2.5rem;
    }

    &__label {
        align-self: center;
        width: 250px;
        padding-right: 60px;
        color: #F24141;
        font-family: "gg sans", sans-serif;
        font-weight: 700;
        font-size: 1.25rem;

        &--no_shadow {
            text-shadow: none;
        }
    }
}
</style>