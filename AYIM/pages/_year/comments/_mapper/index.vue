<template>
    <display-layout
        v-if="user"
        :include-subnav="false"
    >
        <template #sub-nav>
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
                    class="ayim-comment__input"
                    placeholder="write a new comment for this mapper here"
                />
            
                <button
                    v-if="loggedInUser"
                    class="button"
                    @click="create"
                >
                    Create
                </button>
                <button
                    v-else
                    class="button"
                >
                    Login to create
                </button>
            </div>

            <div
                v-if="info"
                class="ayim-comment__info"
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
import axios from "axios";

import DisplayLayout from "../../../../components/DisplayLayout.vue";

import { Comment } from "../../../../../Interfaces/comment";
import { User } from "../../../../../Interfaces/user";

@Component({
    components: {
        DisplayLayout,
    },
})
export default class MapperComments extends Vue {

    @State loggedInUser!: User | null;
    @State selectedMode!: string;
    @State year!: number;

    user: User | null = null;
    comments: Comment[] = []
    targetID = this.$route.params.mapper;
    newComment = "";
    info = "";

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getData();
    }

    async mounted () {
        await this.getData();
    }
    
    async getData () {
        const { data } = await axios.get(`/api/comments?year=${this.year}&user=${this.targetID}&mode=${this.selectedMode}`);

        if (data.error) {
            alert(data.error);
        } else {
            this.comments = data.comments;
            this.user = data.user;
        }
    }

    async create () {
        this.info = "";
        const { data } = await axios.post("/api/comments/create", {
            targetID: this.targetID,
            comment: this.newComment,
            mode: this.selectedMode,
            year: this.year,
        });
            
        if (data.error) {
            this.info = data.error;
        } else {
            this.comments.push(data);
        }
    }

    async update (id) {
        this.info = "";
        const i = this.comments.findIndex(c => c.ID === id);
        const res = await axios.post(`/api/comments/${id}/update`, {
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
        const res = await axios.post(`/api/comments/${id}/remove`);
            
        if (res.data.error) {
            this.info = res.data.error;
        } else if (res.data) {
            const i = this.comments.findIndex(c => c.ID === id);

            if (i !== -1) {
                this.comments.splice(i, 1);
            }
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

    &__input {
        color: white;
        padding: 5px;
        margin: 0;
        background: black;
        box-shadow: $black-shadow;
        border-radius: 5.5px;
        font-size: $font-base;
        font-family: $font-body;
        border: none;
        margin-left: 10px;
        margin-right: 10px;
        width: 100%;
    }

    &__info {
        @extend %box;
        color: $red;
        background-color: $bg-dark;
    }
}

</style>
