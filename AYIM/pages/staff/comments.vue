<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Comments Review
        </div>

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
                    </div>

                    <textarea 
                        v-model="comment.comment"
                        type="text"
                        class="staff-comment__input textarea"
                        rows="2"
                    />

                    <div class="staff-comment__actions">
                        <button
                            class="button button--small staff-comment__action"
                            @click="update(comment.ID)"
                        >
                            validate
                        </button>

                        <button
                            class="button button--small staff-comment__action"
                            @click="remove(comment.ID)"
                        >
                            delete
                        </button>

                        <button
                            v-if="isHeadStaff"
                            class="button button--small staff-comment__action"
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
import axios from "axios";
import { Vue, Component } from "vue-property-decorator";
import { Action, Getter, State } from "vuex-class";
import { Comment } from "../../../Interfaces/comment";
import { MCA } from "../../../Interfaces/mca";

interface GroupedComment {
    mode: string;
    comments: Comment[];
}

@Component
export default class StaffComments extends Vue {
            
    @State year!: number;
    @State mca!: MCA | null;
    @Getter isHeadStaff!: boolean;
    @Action updateYear;

    info = "";
    comments: Comment[] = [];

    get groupedComments (): GroupedComment[] {
        const groups: GroupedComment[] = [];

        for (const comment of this.comments) {
            const i = groups.findIndex(g => g.mode === comment.mode.name);

            if (i !== -1) groups[i].comments.push(comment);
            else groups.push({
                mode: comment.mode.name,
                comments: [comment],
            });
        }

        return groups;
    }
    
    async mounted () {
        if (!this.mca) {
            await this.updateYear(this.year);
        }

        const { data } = await axios.get(`/api/staff/comments`);

        if (!data.error) {
            this.comments = data;
        }
    }

    async update (id) {
        this.info = "";
        const i = this.comments.findIndex(c => c.ID === id);
        const res = await axios.post(`/api/staff/comments/${id}/review`, {
            comment: this.comments[i].comment,
        });
            
        if (res.data.error) {
            this.info = res.data.error;
        } else if (res.data) {
            this.info = "ok";
        }
    }

    async remove (id) {
        this.info = "";

        if (!confirm("Are you sure?")) 
            return;
            
        const res = await axios.post(`/api/staff/comments/${id}/remove`);
            
        if (res.data.error) {
            this.info = res.data.error;
        } else if (res.data) {
            const i = this.comments.findIndex(c => c.ID === id);

            if (i !== -1) {
                this.comments.splice(i, 1);
            }
        }
    }

    async ban (id) {
        this.info = "";

        if (!confirm(`User will not be able to submit new comments and not validated comments will be removed`)) 
            return;
        
        const { data } = await axios.post(`/api/staff/users/${id}/ban`);
            
        if (data.error) {
            this.info = data.error;
        } else if (data.success) {
            this.info = data.success;
            this.comments = this.comments.filter(c => c.commenter.ID !== id);
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
    }

    &__input {
        width: 50%;
    }

    &__actions {
        display: flex;
    }

    &__action {
        margin: 5px;
    }
}

</style>
