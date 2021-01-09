<template>
    <div class="header">
        <img src="../../../Assets/img/ayim-mca/site/2019.png">
        <a
            class="header__title"
            :href="'/'"
            v-html="$t('mca_ayim.header.mca')"
        />
        <a class="header__seperator"><img src="../../../Assets/img/ayim-mca/site/l.png"></a>
        <a
            class="header__title--active"
            href="ayim.html"
            v-html="$t('mca_ayim.header.ayim')"
        />
        <a
            v-if="!user"
            class="header__login"
            @click="login=!login; $router.push({ path: $route.path, query: { login: true }})"
        >
            {{ $t('mca_ayim.header.login') }}
        </a>
        <div 
            v-else
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
                @click="logout=!logout"
            >
                <img 
                    :src="avatarURL"
                    class="header__login--image"
                >
                <div 
                    :class="{'triangle--active': logout}"
                    class="triangle" 
                />
            </div>
        </div>

        <login 
            v-if="login"
            :user="user"
            @close="login=false; $router.push({ path: $route.path })"
        />
        <transition name="fade">
            <a 
                v-if="logout"
                class="header__logout"
                href="/api/logout"
                @click="logout=!logout"
            >
                {{ $t('mca_ayim.header.logout') }}
            </a>
        </transition>
    </div>
</template>

<script>
import login from "./login";

export default {
    components: {
        "login": login,
    },
    props: {
        user: {
            type: Object,
            default: () => {
                return {};
            },
        },
    },
    data () {
        return {
            login: false,
            logout: false,
        };
    },
    computed:  {
        avatarURL: function ()  {
            return this.user && this.user.osu ? this.user.osu.avatar : "";
        },
    },
    mounted: function () {
        if (this.$route.query.login && (!this.user || (this.user && (!this.user.osu.userID || !this.user.discord.userID))))
            this.login = true;
    },
};
</script>

<style lang="scss">
.header {
	display: flex;
	background-color: #000;
	border-bottom-style: solid;
	border-bottom-color: #FFF;
	align-items: center;
    width: 100%;
    flex: 0 0 auto;
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
	font-size: 25px;
	line-height: 0.86;
	letter-spacing: 10px;
	color: #4c4c4c;
	margin-left: 3%;

	&--active {
		font-size: 25px;
		line-height: 0.86;
		letter-spacing: 10px;
		color: #fff;
		margin-left: 3%;
	}
}

.header__login {
	display: flex;
	text-align: right;
	font-size: 1.25rem;
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
		font-size: 1rem;
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
	}
}

.header__logout {
    letter-spacing: 5px;
	position: absolute;
    cursor: pointer;
	right: 0;
	bottom: -52%;
    background-color: #0f0f0f;
    border-radius: 0 0 10px 10px;
    box-shadow: 0px 0px 8px white;
    padding: 1% 4%;
    margin-right: 2%;
    color: white;
    transition: background-color 0.25s, color 0.25s;

    &:hover {
        background-color: white;
        color: #0f0f0f;
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity .25s;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
</style>