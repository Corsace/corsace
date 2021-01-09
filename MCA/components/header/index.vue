<template>
    <div class="header">
        <div class="header__year">
            {{ year }}
            <div class="header__year--coloured">
                <span class="header__year--standard">{{ (''+year)[0] }}</span><span class="header__year--taiko">{{ (''+year)[1] }}</span><span class="header__year--fruits">{{ (''+year)[2] }}</span><span class="header__year--mania">{{ (''+year)[3] }}</span>
            </div>
        </div>
        <nuxt-link
            class="header__title header__title--active"
            :to="'/'"
            v-html="$t('mca_ayim.header.mca')"
        />
        <a class="header__seperator"><img src="../../../CorsaceAssets/img/ayim-mca/site/l.png"></a>
        <a
            class="header__title"
            href="https://ayim.corsace.io"
            v-html="$t('mca_ayim.header.ayim')"
        />
        <div 
            v-if="user && user.osu"
            class="header__login"
        >
            <div class="header__login--text header__login--flex">
                <div class="header__login--gray">
                    {{ $t('mca_ayim.header.welcomeBack') }}
                </div>
                <div>
                    {{ user.osu.username }}
                </div>
            </div>
            <div
                class="header__login--profile header__login--flex" 
                @click="dropdown=!dropdown"
            >
                <img 
                    :src="avatarURL"
                    class="header__login--image"
                >
                <div 
                    :class="triangleClass"
                    class="triangle" 
                />
            </div>
        </div>
        <a
            v-else
            class="header__login"
            @click="login=!login; $router.push({ path: $route.path, query: { login: true }})"
        >
            {{ $t('mca_ayim.header.login') }}
        </a>

        <transition name="fade">
            <dropdown 
                v-if="dropdown"
                :user="user"
                @login="login=!login; $router.push({ path: $route.path, query: { login: true }})"
                @close="dropdown=false"
            />
        </transition>

        <login 
            v-if="login"
            :user="user"
            @close="login=false; $router.push({ path: $route.path })"
        />
    </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";

import login from "./login.vue";
import dropdown from "./dropdown.vue";

import { UserMCAInfo } from "../../../CorsaceModels/user";

export default Vue.extend({
    components: {
        dropdown,
        login,
    },
    props: {
        user: {
            type: Object,
            required: true,
        } as PropOptions<UserMCAInfo>,
        mode: {
            type: String,
            default: "standard",
        },
        year: {
            type: Number,
            default: (new Date).getUTCFullYear() - 1,
        },
    },
    data () {
        return {
            login: false,
            modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
            dropdown: false,
        };
    },
    computed:  {
        avatarURL (): string  {
            return this.user && this.user.osu ? this.user.osu.avatar : "";
        },
        triangleClass (): Record<string, any>  {
            const className = `triangleActive--${this.mode}`;
            const obj = {};
            obj[className] = this.dropdown;
            return obj;
        },
    },
    mounted: function () {
        if (this.$route.query.login && !this.user.osu?.userID)
            this.login = true;
    },
});
</script>

<style lang="scss">
.header {
    width: 100%;

	display: flex;
    flex: 0 0 auto;
    align-items: center;
    
	background-color: #000;
	border-bottom-style: solid;
	border-bottom-color: #FFF;
    
	padding: 0 2%;
    position: relative;

	a {
		float: left;
		text-decoration: none;
	}
}

.header__seperator {
	margin-left: 20px;
}

.header__title {
	font-size: 1.5rem;
	line-height: 0.86;
	letter-spacing: 10px;
	color: #4c4c4c;
	margin-left: 3%;

	&--active {
		color: #fff;
	}
}

.header__login {
	display: flex;
	text-align: right;
	font-size: 1.5rem;
	line-height: 1.19;
	letter-spacing: 1.89px;
	color: #d8d8d8;
	cursor: pointer;
	align-items: center;
	justify-content: flex-end;
    margin-left: auto;

	&--text {
		cursor: initial;
		padding-right: 10px;
	}

	&--gray {
    white-space: nowrap;
		font-size: 1.25rem;
		color: #6f6f6f;
	}

	&--flex {
		flex: 1;
	}

	&--profile {
		display: flex;
		align-items: center;
    justify-content: space-evenly;
	}

	&--image {
		border-radius: 50%;

		width: 50%;
    min-width: 45px;

    padding-right: 10px;
	}
}

$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

@mixin yearNumbering {
    @each $mode in $modes {
        &--#{$mode} {
            text-shadow: -1px -1px 0 var(--#{$mode}), 1px -1px 0 var(--#{$mode}), -1px 1px 0 var(--#{$mode}), 1px 1px 0 var(--#{$mode});
        }
    }
}

.header__year {    
    color: black;
    text-shadow: -1px -1px 0 #363636, 1px -1px 0 #363636, -1px 1px 0 #363636, 1px 1px 0 #363636;
    font-size: 10.25rem;
    font-family: 'Lexend Peta', sans-serif;
    line-height: 0.7;
    letter-spacing: -25px;
    
    display: inline-block;

    height: 100%;
    width: 22%;
    position: relative;
    overflow: hidden;

    @include yearNumbering;

    &--coloured {
        position: absolute;
        top: 5px;
        left: 3.5%;
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity .25s ease-out;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}

@media (max-width: 1080px) {
    .header__title {
        font-size: 1rem;
    }

    .header__login {
        font-size: 0.8rem;

        &--gray {
            font-size: 0.7rem;
        }
    }
}
</style>