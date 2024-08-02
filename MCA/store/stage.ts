import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../Assets/store/mca-ayim";
import { UserChoiceInfo } from "../../Interfaces/user";
import { CategoryStageInfo, SectionCategory } from "../../Interfaces/category";
import { BeatmapInfo, BeatmapsetInfo } from "../../Interfaces/beatmap";
import { Vote } from "../../Interfaces/vote";
import { Nomination } from "../../Interfaces/nomination";
import { StageQuery } from "../../Interfaces/queries";
import { BeatmapsetResult, UserResult } from "../../Interfaces/result";
import { MCAStageData, StageType } from "../../Interfaces/mca";

interface StageState {
    selected: boolean;
    section: SectionCategory,
    categories: CategoryStageInfo[];
    selectedCategory: CategoryStageInfo | null;
    nominations: Nomination[];
    votes: Vote[];
    beatmapsetResults: BeatmapsetResult[];
    userResults: UserResult[];
    stage: StageType;
    count: number;
    beatmaps: BeatmapsetInfo[];
    users: UserChoiceInfo[];
    query: StageQuery;
    favourites: boolean;
    played: boolean;
    loading: boolean;
    showVoteChoiceBox: boolean;
}

export const state = (): StageState => ({
    selected: false,
    section: "",
    selectedCategory: null,
    categories: [],
    nominations: [],
    votes: [],
    beatmapsetResults: [],
    userResults: [],
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
    } as StageQuery,
    favourites: false,
    played: false,
    loading: true,
    showVoteChoiceBox: false,
});

export const mutations: MutationTree<StageState> = {
    loading (stageState, bool) {
        stageState.loading = bool;
    },
    selected (stageState, bool) {
        stageState.selected = bool;
    },
    updateStage (stageState, stage: StageType) {
        stageState.stage = stage;
    },
    updateCategories (stageState, categories) {
        stageState.categories = categories || [];
    },
    updateVotes (stageState, votes) {
        stageState.votes = votes || [];
    },
    addVote (stageState, vote) {
        if (vote)
            stageState.votes.push(vote);
    },
    addNomination (stageState, nomination) {
        if (nomination)
            stageState.nominations.push(nomination);
    },
    removeNomination (stageState, nominationId: number) {
        const i = stageState.nominations.findIndex(n => n.ID === nominationId);

        if (i !== -1) {
            stageState.nominations.splice(i, 1);
        }
    },
    updateNominations (stageState, nominations) {
        stageState.nominations = nominations || [];
    },
    updateCount (stageState, count) {
        stageState.count = count || 0;
    },
    updateBeatmaps (stageState, beatmaps) {
        stageState.beatmaps = beatmaps || [];
    },
    updateUsers (stageState, users) {
        stageState.users = users || [];
    },
    updateBeatmapsetResults (stageState, beatmaps) {
        stageState.beatmapsetResults = beatmaps || [];
    },
    updateUserResults (stageState, users) {
        stageState.userResults = users || [];
    },
    updateSelectedCategory (stageState, category) {
        stageState.selectedCategory = category;
    },
    updateSection (stageState, section: SectionCategory) {
        if (stageState.section !== section)
            stageState.section = section;
    },
    updateQuery (stageState, query) {
        stageState.query = {
            ...stageState.query,
            ...query,
        };
    },
    updateFavourites (stageState, favourites: boolean) {
        stageState.favourites = favourites;
    },
    updatePlayed (stageState, played: boolean) {
        stageState.played = played;
    },
    reset (stageState, sectionReset: boolean) {
        if (sectionReset) {
            stageState.query = {
                category: 0,
                option: "",
                order: "ASC",
                text: "",
                skip: 0,
            } as StageQuery;
            stageState.favourites = false;
            stageState.played = false;
        }
        stageState.section = "beatmaps";
        stageState.selectedCategory = null;
        stageState.beatmaps = [];
        stageState.users = [];
        stageState.count = 0;
    },
    toggleVoteChoiceBox (stageState) {
        stageState.showVoteChoiceBox = !stageState.showVoteChoiceBox;
    },
};

export const getters: GetterTree<StageState, RootState> = {
    relatedCandidacies (stageState): Vote[] | Nomination[] {
        if (!stageState.selectedCategory)
            return [];

        const arr = stageState.stage === "nominating" ? stageState.nominations : stageState.votes;

        // Type doesnt here
        return (arr as Vote[]).filter(v => v.category.ID === stageState.selectedCategory?.id);
    },

    categoriesInfo (stageState): CategoryStageInfo[] {
        if (stageState.stage === "voting")
            return stageState.categories.map(c => {
                const info = {
                    ...c,
                    count: stageState.votes.filter(v => v.category.ID === c.id).length,
                };
                info.maxNominations = 100;
                return info;
            });

        return stageState.categories.map(c => ({
            ...c,
            count: stageState.nominations.filter(n => n.category.ID === c.id).length,
        }));
    },
};

export const actions: ActionTree<StageState, RootState> = {
    updateStage ({ commit }, stage: StageType) {
        commit("updateStage", stage);
    },
    async setInitialData ({ state: stageState, commit, dispatch, rootState }) {
        const mcaState = (rootState as any)["mca-ayim"] as RootState;
        if (!mcaState.mca?.year) {
            await this.$router.push("/");
            return;
        }

        const { data } = await this.$axios.get<MCAStageData | { error: string }>(`/api/${stageState.stage}/${mcaState.mca?.year}`);

        if ("error" in data) {
            console.error(data.error);
            await this.$router.push("/" + mcaState.mca?.year);
            return;
        }

        commit("updateCategories", data.categories);
        if ("nominations" in data)
            commit("updateNominations", data.nominations);
        else
            commit("updateVotes", data.votes);

        if ("nominations" in data && data.nominations?.length && data.nominations.some(n => !n.isValid))
            alert("Some nominations were denied, contact a staff member if you already haven't!");
        else if (stageState.stage === "results")
            await dispatch("updateSelectedCategory", stageState.categories.filter(category => category.type === "Beatmapsets" && (category.mode === mcaState.selectedMode || category.mode === "storyboard"))[0]);
    },
    async updateSelectedCategory ({ commit, dispatch }, category) {
        commit("updateSelectedCategory", category);
        await dispatch("search");
    },
    updateSection ({ commit }, section: SectionCategory) {
        commit("updateSection", section);
    },
    async updateQuery ({ commit, dispatch }, query) {
        commit("updateQuery", query);
        await dispatch("search");
    },
    async updateFavourites ({ commit, dispatch }, favourites: boolean) {
        commit("updateFavourites", favourites);
        await dispatch("search");
    },
    async updatePlayed ({ commit, dispatch }, played: boolean) {
        commit("updatePlayed", played);
        await dispatch("search");
    },
    async search ({ state: stageState, commit, rootState }, skipping = false) {
        if (!stageState.selectedCategory)
            return;

        let skip = 0;
    
        commit("loading", true);

        if (skipping) {
            if (stageState.selectedCategory.type === "Users") skip = stageState.users.length;
            else if (stageState.selectedCategory.type === "Beatmapsets") skip = stageState.beatmaps.length;
        }

        const { data } = await this.$axios.get<{
            list: BeatmapsetInfo[] | BeatmapInfo[] | UserChoiceInfo[],
            count: number,
        }>(`/api/${stageState.stage}/${(rootState as any)["mca-ayim"].mca?.year}/search?mode=${stageState.selectedCategory.mode}&category=${stageState.selectedCategory.id}&option=${stageState.query.option}&order=${stageState.query.order}&favourites=${stageState.favourites}&played=${stageState.played}&text=${stageState.query.text}&skip=${skip}`);
        if (!data.success)
            return alert(data.error);

        commit("loading", false);

        commit("updateCount", data.count);

        if (!data.list)
            return;

        if (stageState.stage === "results") {
            if (stageState.selectedCategory.type === "Users")
                commit("updateUserResults", data.list);
            else if (stageState.selectedCategory.type === "Beatmapsets")
                commit("updateBeatmapsetResults", data.list);
        } else if (stageState.selectedCategory.type === "Users") {
            let users = data.list as UserChoiceInfo[];
            if (skipping) users = [...stageState.users, ...data.list as UserChoiceInfo[]];
            commit("updateUsers", users.filter((val, i, self) => self.findIndex(v => v.corsaceID === val.corsaceID) === i));
        } else if (stageState.selectedCategory.type === "Beatmapsets") {
            let beatmaps = data.list as BeatmapsetInfo[];
            if (skipping) beatmaps = [...stageState.beatmaps, ...data.list as BeatmapsetInfo[]];
            commit("updateBeatmaps", beatmaps.filter((val, i, self) => self.findIndex(v => v.id === val.id) === i));
        }
    },
    reset ({ commit }, sectionReset = false) {
        commit("reset", sectionReset);
    },
    async createNomination ({ commit, state: stageState }, nomineeId: number) {
        if (!stageState.selectedCategory) return;

        commit("selected", true);
        try {
            const { data } = await this.$axios.post(`/api/nominating/create`, {
                categoryId: stageState.selectedCategory.id,
                nomineeId,
            });

            commit("selected", false);

            if (!data.success) {
                alert(data.error);
                return;
            }

            commit("addNomination", data);
        } catch (e) {
            commit("selected", false);
            alert(e);
        }
    },
    async removeNomination ({ commit, state: stageState }, nominationId: number) {
        if (!stageState.selectedCategory) return;

        commit("selected", true);
        try {
            const { data } = await this.$axios.delete(`/api/nominating/${nominationId}`);

            commit("selected", false);

            if (!data.success) {
                alert(data.error);
                return;
            }

            if (data.success) {
                commit("removeNomination", nominationId);
            }
        } catch (e) {
            commit("selected", false);
            alert(e);
        }
    },
    async createVote ({ commit, state: stageState }, payload: { nomineeId: number, vote: number }) {
        if (!stageState.selectedCategory) return;

        commit("selected", true);
        try {
            const { data } = await this.$axios.post(`/api/voting/create`, {
                category: stageState.selectedCategory.id,
                nomineeId: payload.nomineeId,
                choice: payload.vote,
            });

            commit("selected", false);

            if (!data.success) {
                alert(data.error);
                return;
            }

            commit("addVote", data);
        } catch (e) {
            commit("selected", false);
            alert(e);
        }
    },
    async removeVote ({ commit, dispatch }, voteId: number) {
        if (!confirm("Do you want to remove this vote? This will move your votes up by 1")) {
            return;
        }

        commit("selected", true);
        try {
            const { data } = await this.$axios.delete(`/api/voting/${voteId}`);

            commit("selected", false);

            if (!data.success) {
                alert(data.error);
                return;
            }

            if (data.success) {
                await dispatch("setInitialData");
            }
        } catch (e) {
            commit("selected", false);
            alert(e);
        }
    },
    async swapVotes ({ dispatch }, newOrder: Vote[]) {
        const { data } = await this.$axios.post(`/api/voting/swap`, newOrder);

        if (!data.success) {
            alert(data.error);
            return;
        }

        if (data.success) {
            alert(data.success);
            await dispatch("setInitialData");
        }
    },
};