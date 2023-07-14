<template>
    <div class="qualifiers_view">
        <div class="qualifiers_view_day">
            <div class="qualifiers_views_day__date">
                <div class="qualifiers_view_day__date_text">
                    AUGUST 11
                </div>
            </div>
            <hr class="line--even-space line--red">
            <div class="qualifiers_view_day__team">
                <div class="qualifiers_view_day__team_name">
                    <img src="https://seeklogo.com/images/D/dota-2-logo-A8CAC9B4C9-seeklogo.com.png">
                    <div>better lol</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        1:00 UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <ContentButton 
                            class="content_button content_button--disabled"
                            @click.native="togglePopup()"
                        >
                            JOIN
                        </ContentButton>
                    </div>
                </div>
            </div>
            <div class="qualifiers_view_day__team">
                <div class="qualifiers_view_day__team_name">
                    <img src="https://open.corsace.io/avatars/62cc0c8de116dcc335fd1e14.png?1657539728833.jpg">
                    <div>CERES FAUNA FAN CLUB</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        11:00 UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <ContentButton class="content_button content_button--red_outline">
                            JOIN
                        </ContentButton>
                    </div>
                </div>
            </div>
            <div class="qualifiers_view_day__team">
                <div class="qualifiers_view_day__team_name">
                    <img src="../../../Assets/img/corsace.png">
                    <div>EMPTY SLOT</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        12:00 UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <ContentButton class="content_button content_button--red_outline">
                            JOIN
                        </ContentButton>
                    </div>
                </div>
            </div>
        </div>
        <div class="qualifiers_view_day">
            <div class="qualifiers_views_day__date">
                <div class="qualifiers_view_day__date_text">
                    AUGUST 11
                </div>
            </div>
            <hr class="line--even-space line--red">
            <div class="qualifiers_view_day__team">
                <div class="qualifiers_view_day__team_name">
                    <img src="https://seeklogo.com/images/D/dota-2-logo-A8CAC9B4C9-seeklogo.com.png">
                    <div>better lol</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        1:00 UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <ContentButton class="content_button content_button--red_outline">
                            JOIN
                        </ContentButton>
                    </div>
                </div>
            </div>
            <div class="qualifiers_view_day__team">
                <div class="qualifiers_view_day__team_name">
                    <img src="https://open.corsace.io/avatars/62cc0c8de116dcc335fd1e14.png?1657539728833.jpg">
                    <div>CERES FAUNA FAN CLUB</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        11:00 UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <ContentButton class="content_button content_button--red_outline">
                            JOIN
                        </ContentButton>
                    </div>
                </div>
            </div>
            <div class="qualifiers_view_day__team">
                <div class="qualifiers_view_day__team_name">
                    <img src="../../../Assets/img/corsace.png">
                    <div>EMPTY SLOT</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        12:00 UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <ContentButton class="content_button content_button--red_outline">
                            JOIN
                        </ContentButton>
                    </div>
                </div>
            </div>
        </div>
        <div 
            v-show="isOpen"
            @click="togglePopup()"
        >
            <ErrorPopup>
                <span>You cannot create/join a qualifier until you have X players!</span>
                <span>Press anywhere to close</span>
            </ErrorPopup>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import ContentButton from "./ContentButton.vue";
import ErrorPopup from "./ErrorPopup.vue";
import { Mappool } from "../../../Interfaces/mappool";

@Component({
    components: {
        ContentButton,
        ErrorPopup,
    },
})
export default class QualifiersView extends Vue {
    @PropSync("pool", { default: null }) readonly poolData!: Mappool | null;
    isOpen = false;
    togglePopup () {
        this.isOpen = !this.isOpen;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers_view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;

        &_day {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 10px 15px 10px 15px;
        background-image: url('../../img/site/open/checkers-bg.png'), linear-gradient(0deg, #0F0F0F -32.92%, #2F2F2F 84.43%);
        background-repeat: no-repeat;
        background-position: bottom 0px right 0px;
        box-shadow: 0px 4px 4px 0px #00000040;
        margin-bottom: 20px;

        &__date {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            &_text {
                display: flex;
                align-items: center;
                font-family: $font-ggsans;
                font-weight: 500;
                font-size: $font-xl;
                font-style: bold;
                vertical-align: middle;
            }
        }

        &__team {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-bottom: 10px;

            &_name {
                display: flex;
                flex-direction: row;

                & img {
                    height: 3.5rem;
                    width: 3.5rem;
                    object-fit: cover;
                }

                & div {
                    font-family: $font-ggsans;
                    font-weight: 500;
                    font-size: $font-lg;
                    display: flex;
                    align-items: center;
                    vertical-align: middle;
                    margin-left: 50px;
                }
            }

            &_time {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;

                &__element {
                    font-family: $font-ggsans;
                    font-weight: 500;
                    font-size: $font-lg;
                    display: flex;
                    align-items: center;
                    vertical-align: middle;
                    height: 3.5rem;
                }

                &__button {
                    height: 3.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 5rem;
                    margin-left: 25px;
                }
            }
        }
    }
}
</style>