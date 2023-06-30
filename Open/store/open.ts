import { ActionTree, MutationTree, GetterTree } from "vuex";

export interface OpenState {
    site: string;
}

export const state = (): OpenState => ({
    site: "",
});

export const mutations: MutationTree<OpenState> = {
};

export const getters: GetterTree<OpenState, OpenState> = {
};

export const actions: ActionTree<OpenState, OpenState> = {
};