<template>
    <div>
        <h1>Comments Review</h1>

        <hr>

        <div 
            v-for="comment in comments"
            :key="comment.ID"
        >
            {{ comment.ID }} - {{ comment.commenter.osu.username }} - {{ comment.target.osu.username }} - {{ comment.mode.name }} 
            <input 
                v-model="comment.comment"
                type="text"
            >
            <input 
                v-model="comment.isValid"
                type="checkbox"
            >
            <button @click="update(comment.ID)">
                update
            </button>
            <button @click="remove(comment.ID)">
                delete
            </button>
            <button @click="ban(comment.commenter.ID)">
                ban
            </button>
        </div>

        <div>
            {{ info }}
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Axios from "axios";

export default Vue.extend({
    data () {
        return {
            comments: [],
            user: null,
            info: "",
        };
    },
    async mounted () {
        const res = await Axios.get("/api/staff/comments/2019");

        if (res.data && !res.data.error) {
            this.comments = res.data.comments;
            this.user = res.data.user;
        }
    },
    methods: {
        async update (id) {
            this.info = "";
            const i = this.comments.findIndex(c => c.ID === id);
            const res = await Axios.post(`/api/staff/comments/${id}/review`, {
                comment: this.comments[i].comment,
                isValid: this.comments[i].isValid,
            });
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                this.info = "ok";
            }
        },
        async remove (id) {
            this.info = "";
            const res = await Axios.post(`/api/staff/comments/${id}/remove`);
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                const i = this.comments.findIndex(c => c.ID === id);

                if (i !== -1) {
                    this.comments.splice(i, 1);
                }
            }
        },
        async ban (id) {
            this.info = "";
            const res = await Axios.post(`/api/staff/users/${id}/ban`);
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data.success) {
                this.info = res.data.success;
                this.comments = this.comments.filter(c => c.commenter.ID !== id);
            }
        },
    },
});
</script>
