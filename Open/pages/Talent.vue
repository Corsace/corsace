<template>
    <div class="talent">
        <div class="talentHeader">{{ $t('open.header.talent') }}</div>
        <div class="talentCategories" v-if="!loading">
            <div class="talentCategory">
                <div class="talentCategoryHeader">
                    <img src="../../Assets/img/open/corsace.png">
                    CORSACE
                </div>
                <div class="talentCategoryHead">
                    <img src="https://a.ppy.sh/4323406_1531536489.jpeg">
                    <div class="talentHeadTitle">ORGANIZER</div>
                    <a href="https://osu.ppy.sh/u/4323406" class="talentHeadMember">VINXIS</a>
                </div>
                <div class="talentCategoryStaff">
                    <div class="talentStaffMember"
                        v-for="(member, i) of headStaff"
                        :key="i"
                    >
                        <img :src="`https://a.ppy.sh/${member.osuID}?${Math.round(Math.random()*1000000)}.png`">
                        <a :href="`https://osu.ppy.sh/u/${member.osuID}`">{{ member.username }}</a>
                    </div>
                </div>
            </div>
            <div class="talentCategory">
                <div class="talentCategoryHeader">
                    <img src="../../Assets/img/open/sched.png">
                    SCHEDULERS
                </div>
                <div class="talentCategoryStaff">
                    <div class="talentStaffMember"
                        v-for="(member, i) of schedulers"
                        :key="i"
                    >
                        <img :src="`https://a.ppy.sh/${member.osuID}?${Math.round(Math.random()*1000000)}.png`">
                        <a :href="`https://osu.ppy.sh/u/${member.osuID}`">{{ member.username }}</a>
                    </div>
                </div>
            </div>
            <div class="talentCategory">
                <div class="talentCategoryHeader">
                    <img src="../../Assets/img/open/ref.png">
                    REFEREES
                </div>
                <div class="talentCategoryStaff">
                    <div class="talentStaffMember"
                        v-for="(member, i) of referees"
                        :key="i"
                    >
                        <img :src="`https://a.ppy.sh/${member.osuID}?${Math.round(Math.random()*1000000)}.png`">
                        <a :href="`https://osu.ppy.sh/u/${member.osuID}`">{{ member.username }}</a>
                    </div>
                </div>
            </div>
            <div class="talentCategory">
                <div class="talentCategoryHeader">
                    <img src="../../Assets/img/open/stream.png">
                    STREAMERS / COMMENTATORS
                </div>
                <div class="talentCategoryStaff">
                    <div class="talentStaffMember"
                        v-for="(member, i) of streamcomms"
                        :key="i"
                    >
                        <img :src="`https://a.ppy.sh/${member.osuID}?${Math.round(Math.random()*1000000)}.png`">
                        <a :href="`https://osu.ppy.sh/u/${member.osuID}`">{{ member.username }}</a>
                    </div>
                </div>
            </div>
            <div class="talentCategory">
                <div class="talentCategoryHeader">
                    <img src="../../Assets/img/open/pool.png">
                    MAPPOOLERS
                </div>
                <div class="talentCategoryStaff">
                    <div class="talentStaffMember"
                        v-for="(member, i) of poolers"
                        :key="i"
                    >
                        <img :src="`https://a.ppy.sh/${member.osuID}?${Math.round(Math.random()*1000000)}.png`">
                        <a :href="`https://osu.ppy.sh/u/${member.osuID}`">{{ member.username }}</a>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="loading">
            <loading></loading>
        </div>
    </div>
</template>


<script>
import axios from "axios";
import regeneratorRuntime from "regenerator-runtime";

import Loading from "../components/Loading";

export default {
    components: {
        Loading,
    },
    data: () => ({
        headStaff: [],
        poolers: [],
        referees: [],
        streamcomms: [],
        schedulers: [],
        loading: true,
    }),
    mounted: async function() {
        this.loading = true;
        try {
            const res = await axios.get("/api/user/staff");
            if (res.error)
                return alert(res.error);
            const { headStaff, poolers, referees, streamcomms, schedulers } = res.data;
            this.headStaff = headStaff;
            this.poolers = poolers;
            this.referees = referees;
            this.streamcomms = streamcomms;
            this.schedulers = schedulers;
        } catch (err) {
            alert(err);
        }
        this.loading = false;
    }
}
</script>

<style>
.talent {
    padding: 40px;
    display: grid;
    grid-auto-columns: 1fr 2fr 1fr;
    justify-items: center;
    grid-row-gap: 35px;
}

.talentHeader {
    font-size: 60px;
    font-weight: bold;
    text-shadow: 3.5px 3.5px 5px rgba(24, 7, 0, 0.75);
}

.talentCategories {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-row-gap: 40px;
    grid-column-gap: 120px;
}

.talentCategory {
    width: 100%;
    height: fit-content;
    display: grid;
    grid-row-gap: 10px;
    background-color: #202020;
    padding: 40px;
}

.talentCategoryHeader {
    justify-self: center;
    font-size: 36px;
    font-weight: bold;
    color: #b64c4c;
}

.talentCategoryHead {
    justify-self: start;
    display: grid;
    grid-row-gap: 5px;
    grid-column-gap: 10px;
}

.talentCategoryHead img {
    width: 64px;
    height: 64px;
    grid-column: 1/2;
    grid-row: 1/3;;
}

.talentHeadTitle, .talentHeadMember {
    grid-column: 2/3;
}

.talentHeadTitle {
    font-size: 18px;
    font-weight: bold;
}

.talentHeadMember {
    font-size: 32.5px;
    font-weight: bold;
    color: #b64c4c;
}

.talentCategoryStaff {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-row-gap: 10px;
}

.talentStaffMember {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    width: fit-content;
    align-items: center;
    justify-self: center;
}

.talentStaffMember a {
    color: #b64c4c;
    padding-top: 6px;
}

.talentStaffMember img {
    height: 48px;
    width: 48px;
}
</style>
