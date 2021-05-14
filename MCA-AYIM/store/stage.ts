import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "./index";
import { UserCondensedInfo } from "../../Interfaces/user";
import { CategoryStageInfo } from "../../Interfaces/category";
import { BeatmapsetInfo } from "../../Interfaces/beatmap";
import { Vote } from "../../Interfaces/vote";
import { Nomination } from "../../Interfaces/nomination";
import { StageQuery } from "../../Interfaces/queries";

export type SectionCategory = "beatmaps" | "users";
export type StageType = "nominating" | "voting";

interface StageState {
    section: SectionCategory,
    categories: CategoryStageInfo[];
    selectedCategory: CategoryStageInfo | null;
    nominations: Nomination[];
    votes: Vote[];
    stage: StageType;
    count: number;
    beatmaps: BeatmapsetInfo[];
    users: UserCondensedInfo[];
    query: StageQuery;
    showVoteChoiceBox: boolean;
}

export const state = (): StageState => ({
    section: "beatmaps",
    selectedCategory: null,
    categories: [],
    nominations: [],
    votes: [],
    stage: "nominating",
    count: 0,
    beatmaps: [],
    users: [],
    query: {
        category: 0,
        option: "",
        order: "ASC",
        text: "",
        skip: 0,
    },
    showVoteChoiceBox: false,
});

export const mutations: MutationTree<StageState> = {
    updateStage (state, stage) {
        state.stage = stage;
    },
    updateCategories (state, categories) {
        state.categories = categories || [];
    },
    updateVotes (state, votes) {
        state.votes = votes || [];
    },
    addVote (state, vote) {
        if (vote) {
            state.votes.push(vote);
        }
    },
    updateNominations (state, nominations) {
        state.nominations = nominations || [];
    },
    updateCount (state, count) {
        state.count = count || 0;
    },
    updateBeatmaps (state, beatmaps) {
        state.beatmaps = beatmaps || [];
    },
    updateUsers (state, users) {
        state.users = users || [];
    },
    updateSelectedCategory (state, category) {
        state.selectedCategory = category;
    },
    updateSection (state, section) {
        if (state.section !== section) {
            state.section = section;
        }
    },
    updateQuery (state, query) {
        state.query = {
            ...state.query,
            ...query,
        };
    },
    updateBeatmapState (state, beatmapId) {
        const i = state.beatmaps.findIndex(b => b.id === beatmapId);
        if (i !== -1) state.beatmaps[i].chosen = !state.beatmaps[i].chosen;
    },
    updateUserState (state, userId) {
        const i = state.users.findIndex(u => u.corsaceID === userId);
        if (i !== -1) state.users[i].chosen = !state.users[i].chosen;
    },
    updateCategoryCount (state, payload) {
        const i = state.categories.findIndex(category => category.id === payload.categoryId);

        if (i === -1) return;
            
        if (payload.chosen)
            state.categories[i].count++;
        else
            state.categories[i].count--;
    },
    reset (state) {
        state.section = "beatmaps";
        state.selectedCategory = null;
        state.beatmaps = [];
        state.users = [];
        state.count = 0;
    },
    toggleVoteChoiceBox (state) {
        state.showVoteChoiceBox = !state.showVoteChoiceBox;
    },
};

export const getters: GetterTree<StageState, RootState> = {
    relatedVotes (state): Vote[] {
        if (!state.selectedCategory) return [];

        return state.votes.filter(v => v.category.ID === state.selectedCategory?.id);
    },
    categoriesInfo (state): CategoryStageInfo[] {
        if (state.stage === "voting") {
            return state.categories.map(c => {
                const info = {
                    ...c,
                    count: state.votes.filter(v => v.category.ID === c.id).length,
                };
                info.maxNominations = 100;
                return info;
            });
        } else {
            return state.categories;
        }
    },
};

export const actions: ActionTree<StageState, RootState> = {
    updateStage ({ commit }, stage) {
        commit("updateStage", stage);
    },
    async setInitialData ({ state, commit, rootState }) {
        const { data } = await this.$axios.get(`/api/${state.stage}/${rootState.mca?.year}`);

        if (data.error) {
            console.error(data.error);
            return;
        }

        commit("updateCategories", data.categories);
        commit("updateNominations", data.nominations);
        commit("updateVotes", data.votes);
    },
    async updateSelectedCategory ({ commit, dispatch }, category) {
        commit("updateSelectedCategory", category);
        dispatch("search");
    },
    async updateSection ({ commit }, section) {
        commit("updateSection", section);
    },
    async updateQuery ({ commit, dispatch }, query) {
        commit("updateQuery", query);
        dispatch("search");
    },
    async search ({ state, commit, rootState }, skipping = false) {
        if (!state.selectedCategory) return;

        let skip = 0;

        if (skipping) {
            if (state.selectedCategory.type === "Users") skip = state.users.length;
            else if (state.selectedCategory.type === "Beatmapsets") skip = state.beatmaps.length;
        }

        const { data } = await this.$axios.get(`/api/${state.stage}/${rootState.mca?.year}/search?mode=${rootState.selectedMode}&category=${state.selectedCategory.id}&option=${state.query.option}&order=${state.query.order}&text=${state.query.text}&skip=${skip}`);
        if (data.error)
            return alert(data.error);

        commit("updateCount", data.count);

        if (!data.list) return;

        if (state.selectedCategory.type === "Users") {
            let users = data.list;
            if (skipping) users = [...state.users, ...data.list];
            commit("updateUsers", users.filter((val, i, self) => self.findIndex(v => v.corsaceID === val.corsaceID) === i));
        } else if (state.selectedCategory.type === "Beatmapsets") {
            let beatmaps = data.list;
            if (skipping) beatmaps = [...state.beatmaps, ...data.list];
            commit("updateBeatmaps", beatmaps.filter((val, i, self) => self.findIndex(v => v.id === val.id) === i));
        }
    },
    updateBeatmapState ({ commit, state }, beatmapId) {
        commit("updateBeatmapState", beatmapId);
        const beatmap = state.beatmaps.find(b => b.id === beatmapId);
        if (beatmap) {
            commit("updateCategoryCount", {
                categoryId: state.selectedCategory?.id,
                chosen: beatmap.chosen,
            });
        }
    },
    updateUserState ({ commit, state }, userId) {
        commit("updateUserState", userId);
        const user = state.users.find(u => u.corsaceID === userId);
        if (user) {
            commit("updateCategoryCount", {
                categoryId: state.selectedCategory?.id,
                chosen: user.chosen,
            });
        }
    },
    reset ({ commit }) {
        commit("reset");
    },
    async createVote ({ commit, state }, payload: { nomineeId: number, vote: number }) {
        if (!state.selectedCategory) return;
        
        const { data } = await this.$axios.post(`/api/voting/create`, {
            category: state.selectedCategory.id,
            nomineeId: payload.nomineeId,
            choice: payload.vote,
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        commit("addVote", data);
    },
    async removeVote ({ dispatch }, voteId: number) {
        if (!confirm("Do you want to remove this vote? This will move your votes up by 1")) {
            return;
        }

        const { data } = await this.$axios.post(`/api/voting/${voteId}/remove`);

        if (data.error) {
            alert(data.error);
            return;
        }

        if (data.success) {
            await dispatch("setInitialData");
        }
    },
    async swapVote ({ dispatch }, payload: { voteId: number, swapId: number }) {
        const { data } = await this.$axios.post(`/api/voting/${payload.voteId}/swap`, {
            swapId: payload.swapId,
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        if (data.success) {
            await dispatch("setInitialData");
        }
    },
};
