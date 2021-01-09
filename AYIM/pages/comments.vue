<template>
    <div>
        <h1>Comments</h1>

        <div>
            user id -- should be some user search functionaly to get the ids
            <input
                v-model.trim="newTarget"
                type="text"
            >
        </div>
        
        <div>
            comment
            <textarea v-model.trim="newComment" />
        </div>

        <select v-model="newMode">
            <option 
                v-for="mode in modes" 
                :key="mode.ID" 
                :value="mode.ID"
            >
                {{ mode.name }}
            </option>
        </select>
        
        <button @click="create">
            Create
        </button>

        <hr>

        <div 
            v-for="comment in comments"
            :key="comment.ID"
        >
            {{ comment.ID }} - {{ comment.target.osu.username }} - {{ comment.mode.name }}
            <input 
                v-model="comment.comment"
                type="text"
            >
            <button @click="update(comment.ID)">
                update
            </button>
            <button @click="remove(comment.ID)">
                delete
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
            modes: [],
            user: null,
            newTarget: "",
            newComment: "",
            newMode: 1,
            info: "",
        };
    },
    async mounted () {
        const res = await Axios.get("/api/comments/");

        if (res.data.error) {
            this.info = res.data.error;
        } else if (res.data) {
            this.comments = res.data.comments;
            this.modes = res.data.modes;
            this.user = res.data.user;
        }
    },
    methods: {
        async create () {
            this.info = "";
            const res = await Axios.post("/api/comments/create", {
                target: this.newTarget,
                comment: this.newComment,
                mode: this.newMode,
                year: 2019,
            });
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                this.comments.push(res.data);
            }
        },
        async update (id) {
            this.info = "";
            const i = this.comments.findIndex(c => c.ID === id);
            const res = await Axios.post(`/api/comments/${id}/update`, {
                comment: this.comments[i].comment,
            });
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                this.info = "ok";
            }
        },
        async remove (id) {
            this.info = "";
            const res = await Axios.post(`/api/comments/${id}/remove`);
            
            if (res.data.error) {
                this.info = res.data.error;
            } else if (res.data) {
                const i = this.comments.findIndex(c => c.ID === id);

                if (i !== -1) {
                    this.comments.splice(i, 1);
                }
            }
        },
    },
});
</script>
