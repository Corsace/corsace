<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Comments
        </div>
        <search-bar
            :placeholder="$t('ayim.comments.search')"
            @update:search="updateQuery($event)"
        >
            <button
                class="button"
                style="margin: 0 5px;"
                @click="updateFilter()"
            >
                {{ showValidated ? "Hide Validated" : "Show Validated" }}
            </button>
        </search-bar>
        <div
            v-if="info"
            class="info"
        >
            {{ info }}
        </div>
        <div 
            class="scroll__ayim"
            :class="`scroll--${viewTheme}`"
        >
            <div class="staff-container__box">
                <div
                    v-for="comment in comments"
                    :key="comment.ID"
                    class="staff-comment"
                >
                    <div 
                        class="staff-comment__info"
                        :class="`staff-page__link--${comment.mode}`"
                    >
                        <div>
                            from
                            <a
                                :href="`https://osu.ppy.sh/users/${comment.commenter.osuID}`"
                                target="_blank"
                                class="staff-page__link"
                                :class="`staff-page__link--${comment.mode}`"
                            >
                                {{ comment.commenter.osuUsername }}
                            </a>
                        </div>
                        <div>
                            to
                            <a
                                :href="`https://osu.ppy.sh/users/${comment.target.osuID}`"
                                target="_blank"
                                class="staff-page__link"
                                :class="`staff-page__link--${comment.mode}`"
                            >
                                {{ comment.target.osuUsername }}
                            </a>
                        </div>
                        <div v-if="comment.isValid">
                            Validated by {{ comment.reviewer }} at {{ comment.lastReviewedAt?.toString() }}
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
                <div
                    v-if="loading"
                    class="staff-comment__loading"
                >
                    Loading...
                </div>
                <div
                    v-else-if="end"
                    class="staff-comment__loading"
                >
                    No more comments!~
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, State } from "vuex-class";

import SearchBar from "../../../../Assets/components/SearchBar.vue";

import { StaffComment } from "../../../../Interfaces/comment";

@Component({
    head () {
        return {
            title: "Comments | Staff | AYIM",
        };
    },
    components: {
        SearchBar,
    },
})
export default class StaffComments extends Vue {
    @State viewTheme!: "light" | "dark";

    @Getter isHeadStaff!: boolean;

    info = "";
    text = "";
    loading = false;
    showValidated = true;
    end = false;
    comments: StaffComment[] = [];

    async mounted () {
        await this.getData();
    }

    async updateQuery (query: string) {
        this.text = query;
        await this.getData();
    }

    async updateFilter () {
        this.showValidated = !this.showValidated;
        await this.getData();
    }

    async getData () {
        this.end = false;
        this.loading = true;
        this.comments = [];

        let url = `/api/staff/comments/${this.$route.params.year}`;
        if (!this.showValidated) url += "?filter=true";
        if (this.text) url += (url.includes("?") ? "&" : "?") + `text=${this.text}`;

        const { data } = await this.$axios.get<{ staffComments: StaffComment[] }>(url);

        this.loading = false;

        if (!data.success)
            return alert(data.error);
        
        this.comments = data.staffComments;
    
        for (;;) {
            const box = document.querySelector(".staff-scrollTrack");
            if (!box) break;
            if (box.clientHeight >= box.scrollHeight && !this.end) await this.paginate();
            else break;
        }
    }

    async paginate () {
        if (this.end) return;

        this.loading = true;
        let url = `/api/staff/comments/${this.$route.params.year}?skip=${this.comments.length}`;
        if (!this.showValidated) url += "&filter=true";
        if (this.text) url += `&text=${this.text}`;

        const { data } = await this.$axios.get<{ staffComments: StaffComment[] }>(url);

        this.loading = false;

        if (!data.success)
            return alert(data.error);
        
        const staffComments = data.staffComments;
        if (staffComments.length === 0)
            this.end = true;
        else {
            this.comments.push(...staffComments);
            this.comments = this.comments.filter((val, i, self) => self.findIndex(v => v.ID === val.ID) === i);
        }
    }

    async update (id: number) {
        this.info = "";
        const i = this.comments.findIndex(c => c.ID === id);
        const { data } = await this.$axios.post<{
            isValid: boolean;
            reviewer: string;
            lastReviewedAt: string;
        }>(`/api/staff/comments/${id}/review`, {
            comment: this.comments[i].comment,
        });
            
        if (!data.success)
            this.info = data.error;
        else {
            this.comments[i].isValid = data.isValid;
            this.comments[i].reviewer = data.reviewer;
            this.comments[i].lastReviewedAt = new Date(data.lastReviewedAt);
        }
    }

    async remove (id: number) {
        this.info = "";

        if (!confirm("Are you sure?")) 
            return;
            
        const { data } = await this.$axios.post(`/api/staff/comments/${id}/remove`);
            
        if (!data.success)
            this.info = data.error;
        else {
            const i = this.comments.findIndex(c => c.ID === id);

            if (i !== -1) {
                this.comments.splice(i, 1);
            }
        }
    }

    async ban (id: number) {
        this.info = "";

        if (!confirm(`User will not be able to submit new comments and invalidated comments will be removed. Are you sure?`)) 
            return;
        
        const { data } = await this.$axios.post(`/api/staff/comments/${id}/ban`);
            
        if (!data.success)
            this.info = data.error;
        else {
            this.info = "ok";
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
        display: flex;
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

    &__loading {
        @extend %flex-box;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 2rem;
        width: 100%;
    }
}

</style>
