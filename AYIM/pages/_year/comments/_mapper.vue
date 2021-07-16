<template>
    <display-layout
        v-if="user"
        :include-subnav="false"
    >
        <template
            v-if="canComment"
            #sub-nav
        >
            <div class="ayim-comment">
                <div class="ayim-comment__commenter">
                    <div
                        class="ayim-comment__image"
                        :style="`background-image: url('https://a.ppy.sh/${user.osu.userID}')`"
                    />
                    <div class="ayim-text ayim-text--xl">
                        {{ user.osu.username }}
                    </div>
                </div>

                <textarea
                    v-model.trim="newComment"
                    class="ayim-comment__input textarea"
                    placeholder="write a new comment for this mapper here"
                />
            
                <template v-if="loggedInUser">
                    <template v-if="ownComment">
                        <button
                            class="button button__add"
                            @click="update"
                        >
                            {{ $t('ayim.comments.update') }}
                        </button>
                        <button
                            class="button button__remove"
                            @click="remove"
                        >
                            {{ $t('ayim.comments.remove') }}
                        </button>
                    </template>
                    <button
                        v-else
                        class="button button__add"
                        @click="create"
                    >
                        {{ $t('ayim.comments.create') }}
                    </button>
                </template>
                <button
                    v-else
                    class="button"
                >
                    {{ $t('ayim.comments.login') }}
                </button>
            </div>

            <transition name="fade">
                <div
                    v-if="info"
                    class="info"
                >
                    {{ info }}
                </div>
            </transition>
        </template>
        
        <div class="ayim-layout">
            <list-transition class="ayim-comment-layout">
                <div
                    v-for="comment in comments"
                    :key="comment.ID"
                    class="ayim-comment"
                >
                    <div class="ayim-comment__commenter">
                        <div
                            class="ayim-comment__image"
                            :style="`background-image: url('https://a.ppy.sh/${comment.commenter.osu.userID}')`"
                        />
                        <div class="ayim-text ayim-text--xl">
                            {{ comment.commenter.osu.username }}
                        </div>
                        <div
                            v-if="!comment.isValid"
                            class="ayim-text"
                        >
                            {{ $t('ayim.comments.visible') }}
                        </div>
                    </div>

                    <div class="ayim-comment__comment">
                        {{ comment.comment }}
                    </div>
                </div>
            </list-transition>
        </div>
        <notice-modal 
            :title="$t('ayim.comments.name')"
            :text="$t('ayim.comments.notice')"
            :local-key="'overlay'"
        />
    </display-layout>
    <div
        v-else
        class="ayim-comment__loading"
    >
        Loading...
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Vue, Component, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import ListTransition from "../../../../MCA-AYIM/components/ListTransition.vue";
import NoticeModal from "../../../../MCA-AYIM/components/NoticeModal.vue";

import { Comment } from "../../../../Interfaces/comment";
import { User, UserMCAInfo } from "../../../../Interfaces/user";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        ListTransition,
        NoticeModal,
    },
    head () {
        return {
            // @ts-ignore
            title: `${this.user?.osu.username} Comments | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                // @ts-ignore
                { hid: "description", name: "description", content: `Comments for ${this.user?.osu.username} in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                // @ts-ignore
                { hid: "og:title", property: "og:title", content: `${this.user?.osu.username} Comments | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
                // @ts-ignore
                { hid: "og:description", property: "og:description", content: `Comments for ${this.user?.osu.username} in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:site_name", property: "og:site_name", content: "AYIM" },
                { hid: "og:theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class MapperComments extends Vue {

    @State loggedInUser!: UserMCAInfo | null;
    @State selectedMode!: string;
    @State mca!: MCA;

    user: User | null = null;
    comments: Comment[] = []
    targetID = this.$route.params.mapper;
    newComment = "";
    info = "";

    get canComment (): boolean {
        return ((!this.loggedInUser || this.loggedInUser.canComment) && new Date(this.mca.results) > new Date()) || false;
    }

    get ownCommentIndex (): number {
        return this.comments.findIndex(c => c.commenter.ID === this.loggedInUser?.corsaceID);
    }

    get ownComment (): Comment | undefined {
        if (this.ownCommentIndex !== -1) {
            this.newComment = this.comments[this.ownCommentIndex].comment;

            return this.comments[this.ownCommentIndex];
        }

        return undefined;
    }

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getData();
    }

    async mounted () {
        if (this.mca.year === 2020)
            this.$router.replace("/2020");
        await this.getData();
    }
    
    async getData () {
        const { data } = await this.$axios.get(`/api/comments?year=${this.mca.year}&user=${this.targetID}&mode=${this.selectedMode}`);

        if (data.error) {
            alert(data.error);
            this.$router.push(`/${this.mca.year}/comments`);
        } else {
            this.comments = data.comments;
            this.user = data.user;
        }
    }

    async create () {
        this.info = "";
        const { data } = await this.$axios.post("/api/comments/create", {
            targetID: this.targetID,
            comment: this.newComment,
            mode: this.selectedMode,
            year: this.mca.year,
        });
            
        if (data.error) {
            this.info = data.error;
        } else {
            this.info = "Created comment!";
            this.removeInfo();
            this.comments = [data, ...this.comments];
        }
    }

    async update () {
        if (!this.ownComment) return;

        if (this.ownComment.isValid) {
            if (!confirm("Updating will revert the status to pending!")) {
                return;
            }
        }

        this.info = "";
        const { data } = await this.$axios.post(`/api/comments/${this.ownComment.ID}/update`, {
            comment: this.newComment,
        });
            
        if (data.error) {
            this.info = data.error;
        } else {
            this.info = "Updated comment!";
            this.removeInfo();
            this.$set(this.comments, this.ownCommentIndex, data);
        }
    }

    async remove () {
        if (!this.ownComment) return;

        if (!confirm("Are you sure?")) {
            return;
        }

        this.info = "Removed comment!";
        this.removeInfo();
        const { data } = await this.$axios.post(`/api/comments/${this.ownComment.ID}/remove`);
            
        if (data.error) {
            this.info = data.error;
        } else {
            this.comments.splice(this.ownCommentIndex, 1);
        }
    }

    async removeInfo () {
        setTimeout(() => this.info = "", 5000);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.ayim-comment {
    &-layout {
        align-items: flex-start;
        width: 100%;
    }
    
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    
    margin-top: 10px;
    margin-bottom: 10px;
    
    min-height: 80px;
    
    @include breakpoint(laptop) {
        flex-wrap: nowrap;
        justify-content: start;
    }

    &__loading {
        @extend %flex-box;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 2rem;
    }

    &__image {
        @extend %background-image;
    }

    &__commenter {
        @extend %ayim-record;
        flex: 0 1 auto;
        justify-content: center;
        align-items: center;
        min-width: 150px;
    }

    &__comment {
        @extend %ayim-record;
        width: 100%;
    }

    & > .button {
        margin-left: 10px;
    }
}

</style>
