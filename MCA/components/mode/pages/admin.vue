<template>
    <div class="admin">
        <div class="admin__section">
            <selectButton 
                class="admin__button admin__add" 
                :option="'add'" 
                @emit="yearPop=!yearPop"
            />
            <selectButton 
                class="admin__button admin__remove" 
                :option="'remove'"
                @emit="deleteYear"
            />
            <collapsible 
                class="admin__collapsible"
                :selected-mode="selectedMode"
                :title="'years'"
                :list="years"
                :show-extra="true"
                :active="true"
                @target="changeYear"
            />
            <yearPopout 
                v-if="yearPop"
                :info="year"
                @cancel="yearPop=false"
                @send="sendYear"
            />
        </div>
        <div class="admin__section">
            <selectButton
                class="admin__button admin__add" 
                :style="{opacity: !year.name ? 0 : 1}"
                :option="'add'" 
                @emit="year.name ? categoryPop=!categoryPop : 0"
            />
            <selectButton 
                class="admin__button admin__remove" 
                :style="{opacity: !year.name ? 0 : 1}"
                :option="'remove'"
                @emit="deleteCategory"
            />
            <collapsible
                class="admin__collapsible"
                :selected-mode="selectedMode"
                :title="'categories'"
                :list="activeCategories"
                :show-extra="true"
                :active="true"
                :scroll="true"
                @target="changeCategory"
            />
            <categoryPopout 
                v-if="categoryPop"
                :info="category"
                @cancel="categoryPop=false"
                @send="sendCategory"
            />
        </div>
        <div class="admin__section">
            <div class="admin__scroller">
                <choice
                    v-for="i in beatmaps"
                    :key="i"
                    style="width:100%"
                />
            </div>
            <scroll
                class="admin__scroll"
                :scroll-pos="scrollPos"
                :scroll-size="scrollSize"
                :selected-mode="selectedMode"
            />
        </div>
    </div>
</template>

<script lang="ts">
import Axios from "axios";
import Vue from "vue";

import button from "../../button.vue";
import choice from "../../choice.vue";
import collapsible from "../../collapsible.vue";
import scroll from "../../scroll.vue";

import categoryPopout from "../../popout/adminCategoryPopout.vue";
import yearPopout from "../../popout/adminYearPopout.vue";

import { MCAInfo } from "../../../../CorsaceModels/MCA_AYIM/mca";
import { CategoryInfo } from "../../../../CorsaceModels/MCA_AYIM/category";

export default Vue.extend({
    components: {
        choice,
        collapsible,
        scroll,

        categoryPopout,
        yearPopout,

        selectButton: button,
    },
    props: {
        selectedMode: {
            type: String,
            default: "standard",
        },
    }, 
    data () {
        return {
            yearPop: false,
            categoryPop: false,
            years: [] as MCAInfo[],
            categories: [] as CategoryInfo[],
            beatmaps: [],
            year: {} as MCAInfo,
            category: {} as CategoryInfo,
            scrollPos: 0,
            scrollSize: 0,
        };
    },
    computed: {
        activeCategories(): CategoryInfo[] {
            return this.categories.filter(x => x.mode === this.selectedMode);
        },
    },
    async mounted () {
        await this.update();

        const list = document.querySelector(".admin__scroller");
        if (list) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            list.addEventListener("scroll", this.handleScroll);
            this.scrollSize = list.scrollHeight - list.clientHeight;
        }
    },
    methods: {
        handleScroll(event) {
            if (event.target)
            {
                this.scrollPos = event.target.scrollTop;
                this.scrollSize = event.target.scrollHeight - event.target.clientHeight; // U know... just in case the window size changes Lol
            }
        },
        async update() {
            const res = (await Axios.get("/api/admin/")).data;

            if (res.error)
                this.$router.replace("/");

            this.years = res.mca;
            this.years.sort((a, b) => b.name-a.name);
        },
        async sendYear(res) {
            const result = (await Axios.post("/api/admin/createYear", res)).data;
            if (result.error) {
                alert(result.error);
                return;
            }
            this.yearPop = false;

            await this.update();
        },
        async sendCategory(res) {
            res.year = this.year.name;
            res.mode = this.selectedMode;

            const result = (await Axios.post("/api/admin/createCategory", res)).data;
            if (result.error) {
                alert(result.error);
                return;
            }
            this.categoryPop = false;

            console.log(result);

            await this.changeYear(this.year);
        },
        async changeYear(year: MCAInfo) {
            this.year = year;
            const res = (await Axios.get(`/api/admin/${this.year.name}/getYear`)).data;
            if (res.error) {
                alert(res.error);
                return;
            }
            this.categories = res.categories;
        },
        async changeCategory(category: CategoryInfo) {
            this.category = category;
            const res = (await Axios.get(`/api/admin/${this.category.id}/getCategory`)).data;
            if (res.error) {
                alert(res.error);
                return;
            }
            this.beatmaps = res.beatmaps;
        },
        async deleteYear() {
            if (!this.year.name || !confirm(`Are you sure you want to delete ${this.year.name}?`))
                return;

            const res = (await Axios.delete(`/api/admin/${this.year.name}/deleteYear`)).data;
            if (res.error) {
                alert(res.error);
                return;
            }

            this.categories = [];
            this.category = {} as CategoryInfo;

            await this.update();
        },
        async deleteCategory() {
            if (!this.category.id || !confirm(`Are you sure you want to delete ${this.category.name}?`))
                return;
            
            const res = (await Axios.delete(`/api/admin/${this.category.id}/deleteCategory`)).data;
            if (res.error) {
                alert(res.error);
                return;
            }

            await this.changeYear(this.year);
        },
    },
});
</script>

<style lang="scss">
.admin {
    display: flex;

    height: 100%;
    width: 100%;
}

.admin__section {
    flex: 1;

    position: relative;
    height: 100%;
    margin-right: 12px;
    
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.admin__button {
    height: fit-content;

    margin: 12px;

    transition: all 0.5s ease-out;
}

.admin__add {
    color: rgba(0, 255, 0, 0.6);
    text-shadow: 0 0 4px rgba(0, 255, 0, 0.6);
}

.admin__remove {
    color: rgba(255, 0, 0, 0.6);
    text-shadow: 0 0 4px rgba(255, 0, 0, 0.6);
}

.admin__collapsible {
    flex: 0 0 100%;

    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}

.admin__scroller {
    height: 100%;
    width: 100%;

    overflow-x: visible;
    overflow-y: scroll;

    mask-image: linear-gradient(to top, transparent 0%, black 25%);

    &::-webkit-scrollbar {
        opacity: 0;
    }
}

.admin__scroll {
    height: 100%;

    margin-right: -25px;
}

.admin__beatmap {
    width: 100%;
}

.adminPopout {
    position: fixed;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    
    height: 55%;
    width: 28%;
    
    background-color: rgba(0,0,0,0.9);
    box-shadow: 0 0 4px rgba(0,0,0,0.9);
    
    z-index: 100;
}

.adminPopout__section {
    display: flex;
    flex-direction: column;

    padding: 15px;
}

.adminPopout__input {
    font-family: 'Red Hat Display', sans-serif;

    color: black;

    background-color: rgb(115,115,115);
    box-shadow: 0 0 8px rgba(115, 115, 115, 0.61);

    border: 0;

    &:focus {
        outline: none;
    }
}
</style>