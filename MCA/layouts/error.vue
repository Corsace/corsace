<template>
    <div 
        v-if="error.statusCode === 403" 
        class="error"
    >
        <div class="error__large">
            uh oh
        </div>
        <div class="error__text">
            You aren't allowed here yet!
        </div>
        <a 
            class="error__text error__back"
            @click="goBack"
        >
            Let's get you back.
        </a>
    </div>
    <div 
        v-else
        class="error"
    >
        <div class="error__large">
            uh oh
        </div>
        <div class="error__text">
            {{ error.statusCode }}? I guess so.
        </div>
        <a 
            class="error__text error__back"
            @click="goBack"
        >
            Let's get you back.
        </a>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: {
        error: {
            type: Object,
            required: true,
        },
    },
    methods: {
        goBack: function () {
            this.$router.go(-1);
        },
    },
});
</script>

<style lang="scss">
.error {
    background-image: url("../../CorsaceAssets/img/ayim-mca/site/error.png");
    background-size: 80%;
    background-repeat: no-repeat;
    background-position: center;

    height: 100%;
    width: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    font-size: 2rem;
}

.error__large {
    font-family: 'Lexend Peta';
    font-size: 14rem;
    letter-spacing: -50px;
    margin-bottom: -4rem;
}

.error__text {
    margin-top: 4rem;
}

.error__back {
    cursor: pointer;
    text-shadow: 0 0 4px white;
}
</style>