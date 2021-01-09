<template>
    <div class="home">
        <div class="ayim-bg" />
        <div class="left-side" />
        <div class="right-side">
            <modeSwitcher 
                :page="'index'"
            />
        </div>
    </div>
</template>

<script>
import axios from "axios";

import modeSwitcher from "../components/mode/modeSwitcher";

export default {
    components: {
        "modeSwitcher": modeSwitcher,
    },
    data () {
        return {
            user: null,
            value: "0%",
            eligible: false,
            selectedMode: "",
            modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
        };
    },
    mounted: async function() {
        this.selectedMode = this.$route.params.mode || "standard";

        try {
            const data = (await axios.get(`/api/user`)).data;
            
            if (!data.error) {
                this.user = data.user;
            } else {
                console.error(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    },
    methods: {
        async run () {
            console.log((await axios.post(`/api/user/guestDifficulty/2019/osu`)).data);
        },
    },
};
</script>

<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

.home {
    width: 100%;
    padding-bottom: 9vh;
   
    display: flex;
    flex-grow: 1;
        
    @media (min-width: 1200px) {
        margin-bottom: 0px;
    }

    overflow: hidden;

}

.ayim-bg {
    position: absolute;
    bottom: 0px;
    left: 0px;
    z-index: -6;

    height: 100%;
    width: 100%;
    padding-bottom: 9vh;

    background-image: url("../../CorsaceAssets/img/ayim-mca/site/ayim bg.png");
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center left;

	animation: fade-in 0.7s ease-in both;
}

.right-side {
    display: flex;
    height: 100%;
    align-items: flex-end;
}

@media (min-width: 992px) {    
    .left-side {
        flex: 0 0 40%;
        max-width: 40%;
    }
    .right-side {
        flex: 0 0 60%;
        max-width: 60%;
    }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    bottom: 0px;
  }
  100% {
    opacity: 1;
    bottom: 10px;
  }
}

</style>