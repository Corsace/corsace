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
                            class="button"
                            @click="update"
                        >
                            Update
                        </button>
                        <button
                            class="button"
                            @click="remove"
                        >
                            Remove
                        </button>
                    </template>
                    <button
                        v-else
                        class="button"
                        @click="create"
                    >
                        Create
                    </button>
                </template>
                <button
                    v-else
                    class="button"
                >
                    Login to create
                </button>
            </div>

            <div
                v-if="info"
                class="info"
            >
                {{ info }}
            </div>
        </template>
        
        <div class="ayim-comment-layout">
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
                        (not visible yet)
                    </div>
                </div>

                <div class="ayim-comment__comment">
                    {{ comment.comment }}
                </div>
            </div>
        </div>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

import DisplayLayout from "../../../components/DisplayLayout.vue";

import { Comment } from "../../../../Interfaces/comment";
import { User, UserMCAInfo } from "../../../../Interfaces/user";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
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
        return (this.loggedInUser?.canComment && new Date(this.mca.results) > new Date()) || false;
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
        await this.getData();
    }
    
    async getData () {
        const { data } = await this.$axios.get(`/api/comments?year=${this.mca.year}&user=${this.targetID}&mode=${this.selectedMode}`);

        if (data.error) {
            alert(data.error);
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
            this.comments.push(data);
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
            this.info = "ok";
            this.comments[this.ownCommentIndex] = data;
        }
    }

    async remove () {
        if (!this.ownComment) return;

        if (!confirm("Are you sure?")) {
            return;
        }

        this.info = "";
        const { data } = await this.$axios.post(`/api/comments/${this.ownComment.ID}/remove`);
            
        if (data.error) {
            this.info = data.error;
        } else {
            this.comments.splice(this.ownCommentIndex, 1);
        }
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
    justify-content: center;
    
    margin-top: 10px;
    margin-bottom: 10px;
    
    min-height: 80px;

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
    }

    & > .button {
        margin-left: 10px;
    }
}

</style>
