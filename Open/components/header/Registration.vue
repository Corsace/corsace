<template>
    <div class="popupBody">
        <div class="title">{{ $t('open.registration.title') }}</div>
        <div class="discord">
            <div class="step">
                <div class="number">{{ $t('open.registration.step1') }}</div>
                <div class="divider">I</div>
                <div class="type">Discord</div>
            </div>
            <div class="input" v-if="!discordReg">
                <a class="instruction1" href="/api/auth/discord">{{ $t('open.registration.authenticate') }}</a>
            </div>
            <div class="discordRegistered" v-if="discordReg">
                <div class="username">{{ user.username }}</div>
                <img v-if="user.avatarUrl !== null" class="regAvatar" v-bind:src="user.avatarUrl">
                <img v-if="user.avatarUrl === null" class="regAvatar" src="../../../Assets/img/open/defaultDiscordAvatar.png">
                <img class="logout" src="../../../Assets/img/open/logout.png" @click="logout">
            </div>
        </div>
        <div class="osu">
            <div class="step">
                <div class="number">{{ $t('open.registration.step2') }}</div>
                <div class="divider">I</div>
                <div class="type">osu!</div>
            </div>
                
            <div class="input" v-if="discordReg">
                <a class="instruction1" href="/api/auth/osu">{{ $t('open.registration.authenticate') }}</a>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data: () => ({
        active: false,
        codeSent: false,
        osuUsername: "",
        osuCode: "",
    }),
    props: {
        discordReg: Boolean,
        registered: Boolean,
        user: Object
    },
    methods : {
        logout: function() {
            axios.get("/api/auth/logout").then(result => {
                this.$emit('refresh')
            });
        },
        reqCode: function() {
            axios.get('/api/auth/osu/requestCode?username=' + this.osuUsername + '&lang=' + this.$i18n.locale).then(() => {
                setTimeout(() => {
                    axios.get('/api/auth/osu/codeStatus').then(result => {
                        let status = result.data.status
                        if (status === "SUPPOSEDLY_DELIVERED") {
                            this.codeSent = true
                        }
                        else if (status === "RECIPIENT_OFFLINE" || status === "DISCONNECTED") {
                            alert(this.$i18n.messages[this.$i18n.locale].login.online.replace("%%osuusername%%", this.osuUsername))
                        }
                        else if (status === "RECIPIENT_BLOCKED") {
                            alert(this.$i18n.messages[this.$i18n.locale].login.friend.replace("%%osuusername%%", "ThePooN")) // hardcoded, not worth not doing so tbh
                        }
                        this.osuUsername = ""
                    })
                }, 1500);
            }, () => {
                alert('User already registered, or you did too many code requests. Please try again later'); // Don't need locale because it's not that important.
                this.osuUsername = ""
            })
        },
        sendCode: function() {
            axios.get('/api/auth/osu/validateCode?code=' + this.osuCode).then(result => {
                axios.get("/api/user").then(result => {
                    this.$emit('refresh')
                })
            }, error => {
                alert('An error occured or the code is incorrect. Please try again') // Don't need locale because it's not that important.
                this.osuCode = ""
            })
        }
    },
}
</script>

<style>
.popupBody {
    background-image: none;
    background-color: #101010;
    color: #fff;
    display: flex;
    flex-direction: column;
    height: 190px;
    width: 300px;
    position: absolute;
    top: 83px;
    border-radius: 0 0 20px 20px;
    z-index: 2;
}

.title {
    font-size: 36px;
    font-weight: 700;
    display: table-cell;
    padding: 15px;
    line-height: 0.7;
}

.discord, .osu {
    display: grid;
    padding: 0 0 10px 0;
}

.step {
    display: flex;
    margin-bottom: 10px;
}

.input {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 0 0 29%;
}

.number, .divider, .type {
    font-size:18px;
    padding: 0 0 0 3px;
}

.number, .type {
    color: #b64c4c;
}

.number, .divider {
    font-weight: bold;
}

.number {
    padding: 0 0 0 20px;
}

.instruction1, .instruction2, .instruction2::placeholder, .instruction2:focus {
    border: 0;
    color: #c8cfd5;
    font-family: inherit;
    font-size: 12px;
    outline: 0;
    text-decoration: none;
    text-align: center;
}

.instruction1, .instruction2 {
    background: #a04343;
    height: 25px;
    width: 120px;
    padding: 0;
}

.instruction1 {
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

.instruction2, .instruction2:focus {
    font-style: italic;
}

.osuPopup {
    width: 160px;
    background-color: #101010;
    text-align: center;
    border-radius: 0 0 10px 10px;
    padding: 8px 0;
    position: absolute;
    left: 50%;
    top: 100%;
    font-size: 10px;
    font-style: italic;
    margin-left: -80px;
}

.confirm {
    background-color: #a04343;
    cursor: pointer;
    margin: 0 0 0 10px;
    height: 18px;
    width: 18px;
    padding: 3px;
}

.discordRegistered {
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    justify-content: start;
    align-items: center;
    padding: 0 0 0 29%;
}

.regAvatar {
    height: 25px;
    width: 25px;
}

.logout {
    cursor: pointer;
}
</style>
