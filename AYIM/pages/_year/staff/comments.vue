<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Comments Review
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

        <div
            v-if="info"
            class="info"
        >
            {{ info }}
        </div>

        <div class="staff-container">
            <div
                v-for="group in groupedComments"
                :key="group.mode"
                class="staff-container__box"
            >
                <div class="staff-container__title">
                    {{ group.mode }}
                </div>

                <div
                    v-for="comment in group.comments"
                    :key="comment.ID"
                    class="staff-comment"
                >
                    <div class="staff-comment__info">
                        <div>
                            from
                            <a
                                :href="`https://osu.ppy.sh/users/${comment.commenter.osu.userID}`"
                                target="_blank"
                                class="staff-page__link"
                            >
                                {{ comment.commenter.osu.username }}
                            </a>
                        </div>
                        <div>
                            to
                            <a
                                :href="`https://osu.ppy.sh/users/${comment.target.osu.userID}`"
                                target="_blank"
                                class="staff-page__link"
                            >
                                {{ comment.target.osu.username }}
                            </a>
                        </div>
                        <div 
                            v-if="comment.isValid"
                            class="button__add"
                        >
                            Validated by {{ comment.reviewer.osu.username }} at {{ new Date(comment.lastReviewedAt).toString() }}
                        </div>
                    </div>

                    <textarea 
                        v-model="comment.comment"
                        type="text"
                        class="staff-comment__input textarea"
                        rows="2"
                    />

                    <div class="staff-comment__actions">
                        <button
                            class="button button--small button__add staff-comment__action"
                            @click="update(comment.ID)"
                        >
                            validate
                        </button>

                        <button
                            class="button button--small button__remove staff-comment__action"
                            @click="remove(comment.ID)"
                        >
                            delete
                        </button>

                        <button
                            v-if="isHeadStaff"
                            class="button button--small button__remove staff-comment__action"
                            @click="ban(comment.commenter.ID)"
                        >
                            ban
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter } from "vuex-class";

import { Comment } from "../../../../Interfaces/comment";
import { User } from "../../../../Interfaces/user";

interface GroupedComment {
    mode: string;
    comments: Comment[];
}

@Component({
    head () {
        return {
            title: "Comments | Staff | AYIM",
        };
    },
})
export default class StaffComments extends Vue {
            
    @Getter isHeadStaff!: boolean;

    info = "";
    showValidated = true;
    comments: Comment[] = [];

    get groupedComments (): GroupedComment[] {
        const groups: GroupedComment[] = [];

        for (const comment of this.comments) {
            const i = groups.findIndex(g => g.mode === comment.mode.name);
            
            if (!this.showValidated && comment.isValid) continue;

            if (i !== -1) groups[i].comments.push(comment);
            else groups.push({
                mode: comment.mode.name,
                comments: [comment],
            });
        }

        return groups;
    }
    
    async mounted () {
        const { data } = await this.$axios.get(`/api/staff/comments`);

        if (!data.error) {
            this.comments = data;
        }
    }

    async update (id: number) {
        this.info = "";
        const i = this.comments.findIndex(c => c.ID === id);
        const res = await this.$axios.post(`/api/staff/comments/${id}/review`, {
            comment: this.comments[i].comment,
        });
            
        if (res.data.error) {
            this.info = res.data.error;
        } else if (res.data) {
            this.info = "ok";
            const resComment = res.data;
            this.comments[i].isValid = resComment.isValid;
            this.comments[i].reviewer = resComment.reviewer;
            (this.comments[i].reviewer as User).osu.username = resComment.reviewer.osu.username;
            this.comments[i].lastReviewedAt = resComment.lastReviewedAt;
        }
    }

    async remove (id: number) {
        this.info = "";

        if (!confirm("Are you sure?")) 
            return;
            
        const res = await this.$axios.post(`/api/staff/comments/${id}/remove`);
            
        if (res.data.error) {
            this.info = res.data.error;
        } else if (res.data) {
            const i = this.comments.findIndex(c => c.ID === id);

            if (i !== -1) {
                this.comments.splice(i, 1);
            }
        }
    }

    async ban (id: number) {
        this.info = "";

        if (!confirm(`User will not be able to submit new comments and not validated comments will be removed`)) 
            return;
        
        const { data } = await this.$axios.post(`/api/staff/users/${id}/ban`);
            
        if (data.error) {
            this.info = data.error;
        } else if (data.success) {
            this.info = data.success;
            this.comments = this.comments.filter(c => !(c.commenter.ID === id && !c.isValid));
        }
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-comment {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    &__info {
        display:flex;
        flex-direction: column;
        flex: 1;
    }

    &__input {
        width: 50%;
        flex: 4;
    }

    &__actions {
        display: flex;
    }

    &__action {
        margin: 5px;
    }
}

</style>
