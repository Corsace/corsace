<template>
    <div class="stage">
        <div class="stage__categories">
            <collapsible
                :selected-mode="selectedMode"
                :title="'beatmap categories'"
                :list="beatmapCategories"
                :active="section==='beatmap categories'"
                :show-extra="true"
                @activate="changeSection('beatmap categories')"
                @target="changeCategory"
            />
            <collapsible
                :selected-mode="selectedMode"
                :title="'user categories'"
                :list="userCategories"
                :active="section==='user categories'"
                :show-extra="true"
                @activate="changeSection('user categories')"
                @target="changeCategory"
            />
        </div>
        <div class="category__count">
            <div class="category__countNumber">
                {{ count }}
            </div>
            <div class="category__countDivider" />
            <div 
                class="category__countCandidates"
                :class="`category__countCandidates--${selectedMode}`"
            >
                candidates
            </div>
        </div>
        <div class="category__general">
            <div 
                class="category__head"
                :class="`category__head--${selectedMode}`"
            >
                <div class="category__headShapes">
                    <div 
                        class="category__headShapeLarge"
                        :class="`category__headShape--${selectedMode}`"
                    />
                    <div 
                        class="category__headShapeSmall"
                        :class="`category__headShape--${selectedMode}`"
                    />
                    <div 
                        class="category__headShapeSmall2"
                        :class="`category__headShape--${selectedMode}`"
                    />
                </div>
                <div class="category__headTitle">
                    {{ category.name ? category.name.toUpperCase() : "" }}
                </div>
                <div class="category__headDesc">
                    {{ category.description + (category.isFiltered ? " (auto filter enabled)" : "") }}
                </div>
            </div>
            <div class="category__selection">
                <search
                    class="category__selectionSearch" 
                    :option="option"
                    @search="updSearch"
                    @option="updOption"
                />
                <div class="category__selectionArea">
                    <div class="category__selectionMaps">
                        <choice
                            v-for="(item, i) in section === 'user categories' ? users : beatmaps"
                            :key="i"
                            :choice="item"
                            class="category__Beatmap"
                            @choose="nominate(item)"
                        />
                    </div>
                    <scroll
                        :scroll-pos="scrollPos"
                        :scroll-size="scrollSize"
                        :selected-mode="selectedMode"
                        @bottom="append"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

import collapsible from "../../collapsible.vue";
import search from "../../search.vue";
import scroll from "../../scroll.vue";
import choice from "../../choice.vue";
import Axios from "axios";
import { CategoryStageInfo } from "../../../../CorsaceModels/MCA_AYIM/category";
import { BeatmapsetInfo } from "../../../../CorsaceModels/beatmapset";
import { UserCondensedInfo } from "../../../../CorsaceModels/user";

export default Vue.extend({
    components: {
        choice,
        collapsible,
        search,
        scroll,
    },
    props: {
        selectedMode: {
            type: String,
            default: "standard",
        },
        phase: {
            type: Object,
            default: function () {
                return {};
            },
        },
    },
    data () {
        return {
            count: 0,
            section: "",
            searchText: "",
            option: "DATE",
            order: "ASC",
            category: {} as CategoryStageInfo,
            scrollPos: 0,
            scrollSize: 1,
            fullCategories: [] as CategoryStageInfo[],
            nominations: [] as any[],
            year: (new Date).getUTCFullYear() - 1,
            stage: "nominating",
            beatmaps: [] as BeatmapsetInfo[],
            users: [] as UserCondensedInfo[],
            beatmapOptions: ["DATE", "ARTIST", "TITLE", "FAVS", "CREATOR", "SR"],
            userOptions: ["ID", "ALPH"],
        };
    },
    computed: {
        userCategories(): CategoryStageInfo[] {
            return this.fullCategories.filter(x => x.type === "Users" && x.mode === this.selectedMode);
        },
        beatmapCategories(): CategoryStageInfo[] {
            return this.fullCategories.filter(x => x.type === "Beatmapsets" && x.mode === this.selectedMode);
        },
        modeNum(): number {
            const modeNums = {
                "standard": 1,
                "taiko": 2,
                "fruits": 3,
                "mania": 4,
                "storyboard": 5,
            };

            return modeNums[this.selectedMode];
        },
    },
    watch: {
        selectedMode: function() {
            this.reset();
        },
    },
    async mounted () {
        const list = document.querySelector(".category__selectionMaps");
        if (list) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            list.addEventListener("scroll", this.handleScroll);
            this.scrollSize = list.scrollHeight - list.clientHeight;
        }

        if (/^20\d\d$/.test(this.$route.params.year))
            this.year = parseInt(this.$route.params.year);

        if (/^(nominating|nominate)$/i.test(this.$route.params.year) || /^(nominating|nominate)$/.test(this.$route.params.stage))
            this.stage = "nominating";
        else if (/^(vote|voting)$/i.test(this.$route.params.year) || /^(vote|voting)$/.test(this.$route.params.stage))
            this.stage = "voting";

        if (this.phase.phase !== this.stage)
            this.$emit("phase", this.stage);
        

        const data = (await Axios.get(`/api/${this.stage}/${this.year}`)).data;

        if (data.error) {
            console.error(data.error);
            return;
        }

        this.fullCategories = data.categories;
        this.nominations = data.nominations;
    },
    methods: {
        handleScroll(event) {
            if (event.target)
            {
                this.scrollPos = event.target.scrollTop;
                this.scrollSize = event.target.scrollHeight - event.target.clientHeight; // U know... just in case the window size changes Lol
            }
        },
        async changeCategory(target) {
            this.category = target;
            if (this.category.type === "Users") {
                const data = (await Axios.get(`/api/nominating/search/${this.modeNum}/${this.category.id}/${this.option + this.order}/0/${this.year}?text=${this.searchText}`)).data;
                if (data.error)
                    return alert(data.error);
                this.users = data.list;
                this.users = this.users.filter((val, i, self) => self.findIndex(v => v.corsaceID === val.corsaceID) === i);
                this.count = data.count;
            } else if (this.category.type === "Beatmapsets") {
                const data = (await Axios.get(`/api/nominating/search/${this.modeNum}/${this.category.id}/${this.option + this.order}/0/${this.year}?text=${this.searchText}`)).data;
                if (data.error)
                    return alert(data.error);
                this.beatmaps = data.list;
                this.beatmaps = this.beatmaps.filter((val, i, self) => self.findIndex(v => v.id === val.id) === i);
                this.count = data.count;
            }
        },
        changeSection(target) {
            if (this.section !== target) {
                this.section = target;
                this.category = {} as CategoryStageInfo;
                this.beatmaps = [];
                this.users = [];
                this.count = 0;
                this.scrollPos = 0;
                this.scrollSize = 1;
            }
        },
        updSearch(text, order) {
            this.searchText = text;
            this.order = order;
            setTimeout(async () => {
                if (this.searchText === text)
                    await this.search();
            }, 250);
        },
        async updOption(order) {
            const options = this.section === "beatmap categories" ? this.beatmapOptions : this.userOptions; 
            let target = options[0];
            for (const option of options) {
                if (option === this.option) {
                    const index = options.indexOf(option);
                    if (index !== options.length-1) {
                        target = options[index+1];
                    }
                }
            }
            this.option = target;
            this.order = order;
            await this.search();
        },
        async search() {
            if (!this.category.id)
                return;

            const data = (await Axios.get(`/api/nominating/search/${this.modeNum}/${this.category.id}/${this.option + this.order}/0/${this.year}?text=${this.searchText}`)).data;
            if (this.section === "beatmap categories") {
                this.beatmaps = data.list;
                this.beatmaps = this.beatmaps.filter((val, i, self) => self.findIndex(v => v.id === val.id) === i);
            } else if (this.section === "user categories") {
                this.users = data.list;
                this.users = this.users.filter((val, i, self) => self.findIndex(v => v.corsaceID === val.corsaceID) === i);
            }
            this.count = data.count;
        },
        async append() {
            if (this.section === "beatmap categories") {
                this.beatmaps.push(...(await Axios.get(`/api/nominating/search/${this.modeNum}/${this.category.id}/${this.option + this.order}/${this.beatmaps.length}/${this.year}?text=${this.searchText}`)).data.list);
                this.beatmaps = this.beatmaps.filter((val, i, self) => self.findIndex(v => v.id === val.id) === i);
            } else if (this.section === "user categories") {
                this.users.push(...(await Axios.get(`/api/nominating/search/${this.modeNum}/${this.category.id}/${this.option + this.order}/${this.users.length}/${this.year}?text=${this.searchText}`)).data.list);
                this.users = this.users.filter((val, i, self) => self.findIndex(v => v.corsaceID === val.corsaceID) === i);
            }
        },
        async nominate(choice) {
            let res: any;
            if (!choice.chosen) {
                const data = {
                    categoryId: this.category.id,
                    nomineeId: this.section === "beatmap categories" ? choice.id : choice.corsaceID,
                };
                res = (await Axios.post(`/api/nominating/create`, data)).data;
            } else
                res = (await Axios.delete(`/api/nominating/remove/${this.category.id}/${this.section === "beatmap categories" ? choice.id : choice.corsaceID}`)).data;

            if (res.error)
                return alert(res.error);
            
            if (this.section === "beatmap categories")
                this.beatmaps[this.beatmaps.findIndex(beatmap => beatmap.id === choice.id)].chosen = !this.beatmaps[this.beatmaps.findIndex(beatmap => beatmap.id === choice.id)].chosen;
            else if (this.section === "user categories")
                this.users[this.users.findIndex(user => user.corsaceID === choice.corsaceID)].chosen = !this.users[this.users.findIndex(user => user.corsaceID === choice.corsaceID)].chosen;
            
            if (!choice.chosen)
                this.fullCategories[this.fullCategories.findIndex(category => category.id === this.category.id)].count--;
            else
                this.fullCategories[this.fullCategories.findIndex(category => category.id === this.category.id)].count++;
        },
        reset() {
            this.section = "";
            this.count = 0;
            this.scrollPos = 0;
            this.scrollSize = 1;
            this.category = {} as CategoryStageInfo;
            this.beatmaps = [] as BeatmapsetInfo[];
            this.users = [] as UserCondensedInfo[];
        },
    },
});
</script>

<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

%spaced-container {
    margin-bottom: 40px;
    display: flex;
    justify-content: space-around;
}

%half-box {
    background-color: rgba(0, 0, 0, 0.6); 

    border-radius: 7px; 
    margin: 5px 20px;
    padding: 2%;

    flex: 1 1 100%;
    
    @media (min-width: 1200px) {
        flex-wrap: nowrap;
        flex: 1 1 50%;
    }
}

@mixin mode-category__text {
    @each $mode in $modes {
        &--#{$mode} {
            color: var(--#{$mode});
        }
    }
}

@mixin mode-category__candidates {
    @each $mode in $modes {
        &--#{$mode} {
            border: 1px solid var(--#{$mode});
            border-left: 0;
        }
    }
}

@mixin mode-category__shapes {
    @each $mode in $modes {
        &--#{$mode} {
            background-color: var(--#{$mode});
        }
    }
}

.stage {
    display: flex;
}

.stage__categories {
    flex: 4;
    position: relative;
}

.category__count {
    flex: 1;
    display: flex;

    align-items: center;
    height: fit-content;

    position: relative;

    z-index: -100;

    &Number {
        font-family: 'Scoreboard';
        font-size: 2.25rem;
        line-height: 95px;
        text-align: center;
        background-color: rgba(0,0,0,0.6);

        border: 4px solid;
        border-radius: 50%;
        
        width: 100px;
        height: 100px;
    }

    &Divider {
        border: 2px solid white;
        position: absolute;
        left: 47.5px;
        bottom: -349px;
        height: 350px;
        width: 5px;
        border-bottom: none;
        box-shadow: 0 0 2px white;
    }

    &Candidates {
        padding: 6px;
        background-color: white;
        border-radius: 0 25px 25px 0;
        position: relative;
        left: -2px;

        font-size: 1.2rem;
        line-height: 0.7;

        @include mode-category__text;

        transition: all 0.25s ease-out;
    }
}

.category__general {
    flex: 8;
    display: flex;
    flex-direction: column;
}

.category__head {
    background-color: white;
    border-radius: 5.5px 0 0 5.5px;
    box-shadow: 0px 0px 1% rgba(0, 0, 0, 0.63);

    height: 100px;
    padding-right: 3%;

    line-height: 0.9;

    display: grid;

    position: relative;
    width: 108%;
    left: -8%;

    overflow: hidden;
    z-index: -101;

    @include mode-category__text;

    &Title {
        font-weight: bold;
        font-size: 5rem;

        grid-column: 2;
        justify-self: end;
        align-self: end;

        transition: all 0.25s ease-out;
    }

    &Desc {
        font-size: 1.3rem;
        font-style: italic;

        grid-column: 2;
        justify-self: end;

        transition: all 0.25s ease-out;
    }

    &Shapes {
        background-color: #242424;

        position: relative;

        grid-row: 1 / 3;
        width: 206px;
    }

    &Shape {
        @include mode-category__shapes;

        &Large, &Small, &Small2 {
            transform: rotate(45deg);

            position: absolute;

            transition: all 0.25s ease-out;
        }

        &Small, &Small2 {
            height: 150px;
            width: 23px;
        }

        &Large {
            height: 300px;
            width: 300px;

            right: 30%;
            top: -150%;
        }

        &Small {
            right: 43%;
            top: 48%;   
        }

        &Small2 {
            right: 3%;
            top: 4%;
        }
    }
}

.category__selection {
    width: 110%;
    left: -10%;
    position: relative;

    &Search {
        padding: 15px 0;
    }

    &Area {
        height: 30vh;
        position: relative;
    }

    &Maps {
        display: flex;
        flex-wrap: wrap;

        overflow-y: scroll;
        height: 100%;

        mask-image: linear-gradient(to top, transparent 0%, black 25%);

        padding: 15px;
        top: -15px;
        left: -15px;
        position: relative;

        &::-webkit-scrollbar {
            display: none;
        }
    }
}

@media (max-width: 1418px) and (min-width: 1065px) {  
    .category__head {
        &Shapes {
            width: 111px;
        }

        &Shape {
            &Large {
                right: 56%;
                top: -150%;
            }

            &Small {
                right: 87%;
                top: 54%;   
            }

            &Small2 {
                right: 21%;
                top: 19%;
            }
        }
    } 
}

@media (max-width: 1319px) and (min-width: 1065px) {
    .category__head {
        &Shapes {
            display: none;
        }
    }
    .category__count {
        &Candidates {
            @include mode-category__candidates;
        }
    }
}

@media (max-width: 1205px) and (min-width: 1065px) {
    .category__head {
        &Title {
            font-size: 4rem;
        }
        &Desc {
            font-size: 1rem;
        }
    }
}

@media (max-width: 1104px) and (min-width: 1065px) {
    .category__head {
        &Title {
            font-size: 3.6rem;
        }
    }
}

@media (max-width: 1065px) {
    .stage {
        flex-wrap: wrap;
    }

    .stage__category {
        max-height: 77px;

        &--active {
            max-height: 457px;
        }
    }

    .stage__categories {
        flex: 0 0 100%;

        padding-bottom: 10px;
    }
    
    .category__Beatmap {
        width: 48%;
    }
}

@media (max-width: 1840px) {
    .category__Beatmap {
        width: 48%;
    }
}

@media (max-width: 1430px) {
    .category__Beatmap {
        width: 100%;
    }
}
</style>