<template>
    <div class="header">
        <nuxt-link
            class="header__year-container"
            :to="`/${$route.params.year}`"
        >
            <div class="header__year">
                {{ $route.params.year }}
            </div>
            <div class="header__year header__year--coloured">
                <span class="header__year--standard">
                    {{ ('' + $route.params.year)[0] }}
                </span>
                <span class="header__year--taiko">
                    {{ ('' + $route.params.year)[1] }}
                </span>
                <span class="header__year--fruits">
                    {{ ('' + $route.params.year)[2] }}
                </span>
                <span class="header__year--mania">
                    {{ ('' + $route.params.year)[3] }}
                </span>
            </div>
        </nuxt-link>
        <a
            class="header__title"
            :class="site === 'mca' ? 'header__title--active' : ''"
            href="https://mca.corsace.io"
            v-html="$t('mca_ayim.header.mca')"
        />
        <a class="header__seperator">
            <img src="../../../Assets/img/ayim-mca/site/l.png">
        </a>
        <a
            class="header__title"
            :class="site === 'ayim' ? 'header__title--active' : ''"
            href="https://ayim.corsace.io"
            v-html="$t('mca_ayim.header.ayim')"
        />

        <div 
            v-if="loggedInUser && loggedInUser.osu"
            class="header-login"
        >
            <div class="header-login__welcome-container">
                <div class="header-login__welcome">
                    {{ $t('mca_ayim.header.welcomeBack') }}
                </div>
                <div class="header-login__username">
                    {{ loggedInUser.osu.username }}
                </div>
            </div>
            <div
                class="header-login__dropdown" 
                @click="showDropdown = !showDropdown"
            >
                <img 
                    :src="avatarURL"
                    class="header-login__avatar"
                >
                <div 
                    class="triangle" 
                    :class="triangleClass"
                />
            </div>
        </div>

        <a
            v-else
            class="header-login"
            @click.prevent="toogleLoginModal"
        >
            {{ $t('mca_ayim.header.login') }}
        </a>

        <transition name="fade">
            <the-header-dropdown
                v-if="showDropdown"
                :site="site"
                @showLoginModal="toogleLoginModal"
                @close="showDropdown = false"
            />
        </transition>

        <login-modal
            v-if="showLoginModal"
            :site="site"
            @close="toogleLoginModal"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

import LoginModal from "./LoginModal.vue";
import TheHeaderDropdown from "./TheHeaderDropdown.vue";

import { UserMCAInfo } from "../../../Interfaces/user";

@Component({
    components: {
        TheHeaderDropdown,
        LoginModal,
    },
})
export default class TheHeader extends Vue {

    @Prop({ type: String, required: true }) readonly site!: string;

    @State loggedInUser!: UserMCAInfo;
    @State selectedMode!: string;

    showLoginModal = false;
    showDropdown = false;

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar || "";
    }

    get triangleClass (): Record<string, any>  {
        const className = `triangle-active--${this.selectedMode}`;
        const obj = {};
        obj[className] = this.showDropdown;
        return obj;
    }

    toogleLoginModal (): void {
        this.showLoginModal = !this.showLoginModal;
    }

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.header {
    width: 100%;
	display: flex;
    align-items: center;
	background-color: #000;
	border-bottom-style: solid;
    border-bottom-color: #FFF;
    border-bottom-width: 3px;
	padding: 0 2%;
    position: relative;
    @include transition();
    height: 70px;

	a > {
		float: left;
		text-decoration: none;
    }
    
    @include breakpoint(desktop) {
        height: 100px;
    }
}

.header__seperator {
	margin-left: 20px;
	margin-right: 20px;
}

.header__title {
	line-height: 0.86;
	letter-spacing: 10px;
	color: #4c4c4c;

	&--active {
		color: #fff;
    }
}

@include breakpoint(mobile) {
    .header__title, .header__seperator {
        display: none;
    }
}

.header-login {
	display: flex;
	text-align: right;
	letter-spacing: 1.89px;
	color: #d8d8d8;
	align-items: center;
	justify-content: flex-end;
    margin-left: auto;
    
    &__welcome {
        color: #6f6f6f;
    }

    &__username {
        text-transform: uppercase;
    }

    &__dropdown {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 0 0 0%;
        cursor: pointer;
    }

	&__avatar {
		border-radius: 100%;

		width: 100%;
        min-width: 50px;

        margin-left: 15px;
        margin-right: 15px;
	}
}

@mixin yearNumbering {
    @each $mode in $modes {
        &--#{$mode} {
            text-shadow: -1px -1px 0 var(--#{$mode}), 1px -1px 0 var(--#{$mode}), -1px 1px 0 var(--#{$mode}), 1px 1px 0 var(--#{$mode});
        }
    }
}

.header__year {
    &-container {
        position: relative;
        width: 250px;
        height: 100%;
        margin-right: 10px;
        display: none;

        @include breakpoint(tablet) {
            display: block;
        }
    }

    color: black;
    text-shadow: -1px -1px 0 #363636, 1px -1px 0 #363636, -1px 1px 0 #363636, 1px 1px 0 #363636;
    font-size: 5.5rem;
    font-family: 'Lexend Peta', sans-serif;
    line-height: 0.7;
    letter-spacing: -5px;
    height: 100%;
    width: 100%;
    position: relative;
    overflow: hidden;
    top: -8px;

    @include yearNumbering;

    &--coloured {
        position: absolute;
        top: 0px;
        left: 8px;
        letter-spacing: -22px;
    }
}

@include breakpoint(desktop) {
    .header__title, .header__login {
        font-size: $font-xl;
    }

    .header__year {
        font-size: 8.5rem;
        letter-spacing: -20px;

        &-container {
            width: 370px;
        }
        
        &--coloured {
            letter-spacing: -39px;
        }
    }
}
</style>