<template>
    <div class="info">
        <div class="info__header">
            {{ $t('open.info.title') }}
            <hr class="line--red line--bottom-space">
            <hr class="line--red line--bottom-space">
        </div>
        <div class="info_main">
            <div class="info_desc">
                <div>
                    <img src="../../Assets/img/site/open/banner.png">
                </div>
                <hr class="line--gray line--no-fill">
                <div class="info_desc__text">
                    {{ $t('open.info.description') }}
                </div>
                <hr class="line--gray line--no-fill">
                <div class="info_match">
                    <MatchBox>
                        <template #title>
                            {{ $t('open.info.matchInfo.matchSize') }}
                        </template>
                        4v4
                    </MatchBox>
                    <MatchBox>
                        <template #title>
                            {{ $t('open.info.matchInfo.minPlayers') }}
                        </template>
                        6
                    </MatchBox>
                    <MatchBox>
                        <template #title>
                            {{ $t('open.info.matchInfo.maxPlayers') }}
                        </template>
                        8
                    </MatchBox>
                    <MatchBox>
                        <template #title>
                            SAMPLE TEXT
                        </template>
                        88
                    </MatchBox>
                    <MatchBox>
                        <template #title>
                            SAMPLE TEXT
                        </template>
                        727
                    </MatchBox>
                </div>
            </div>
            <div class="info_stages">
                <div class="info_stage_selector">
                    <ContentButton class="qualifiers_button--active qualifiers_button--right_margin">
                        {{ $t('open.info.headings.stage') }} 1
                    </ContentButton>
                    <ContentButton class="qualifiers_button--right_margin">
                        {{ $t('open.info.headings.stage') }} 2
                    </ContentButton>
                    <ContentButton class="qualifiers_button--right_margin">
                        {{ $t('open.info.headings.stage') }} 3
                    </ContentButton>
                    <ContentButton class="qualifiers_button--right_margin">
                        {{ $t('open.info.headings.stage') }} 4
                    </ContentButton>
                </div>
                <div class="info_stage_panel">
                    <div class="info_stage_title">
                        {{ $t('open.info.headings.qualifiers') }} 
                        <span class="info_stage_title--red"> {{ $t('open.info.headings.ql') }}</span> 
                        <div class="info_stage_title__status">
                            <MatchStatus class="status status--not_started">
                                {{ $t('open.info.status.notStarted') }}
                            </MatchStatus>
                        </div>
                        <hr class="line--gray line--bottom-space-default">
                    </div>
                    <div class="info_stage_data">
                        <div class="info_stage_data__content">
                            <InfoData>
                                <template #title>
                                    ID
                                </template>
                                <template #value>
                                    5
                                </template>
                            </InfoData>
                            <InfoData>
                                <template #title>
                                    SCORING METHOD
                                </template>
                                <template #value>
                                    SCORE V2
                                </template>
                            </InfoData>
                            <InfoData>
                                <template #title>
                                    TYPE
                                </template>
                                <template #value>
                                    Qualifiers
                                </template>
                            </InfoData>
                        </div>
                        <div class="line--vertical_gray" />
                        <div class="info_stage_data__content">
                            <InfoData>
                                <template #title>
                                    START DATE
                                </template>
                                <template #value>
                                    May 29, 2023 10:41am
                                </template>
                            </InfoData>
                            <InfoData>
                                <template #title>
                                    END DATE
                                </template>
                                <template #value>
                                    July 30, 2023 7:58pm
                                </template>
                            </InfoData>
                            <InfoData>
                                <template #title>
                                    ROUNDS
                                </template>
                                <template #value>
                                    N/A
                                </template>
                            </InfoData>
                        </div>
                    </div>
                </div>
                <div class="info_stage_panel">
                    <div class="info_stage_title">
                        MAPPOOLS 
                    </div>
                    <hr class="line--gray line--bottom-space-default">
                    <div class="info_stage_data--bottom_padding">
                        <div class="info_stage_data__content">
                            <div class="info_stage_data_mappools_selector">
                                <ContentButton class="qualifiers_button--active qualifiers_button--bottom_margin">
                                    Knockout 1A (KO1A)
                                </ContentButton>
                                <ContentButton class="qualifiers_button--bottom_margin">
                                    Knockout 1B (KO1B)
                                </ContentButton>
                                <ContentButton class="qualifiers_button--bottom_margin">
                                    Knockout 1C (KO1C)
                                </ContentButton>
                                <ContentButton class="qualifiers_button--bottom_margin">
                                    Knockout 1 (KO1)
                                </ContentButton>
                            </div>
                        </div>
                        <div class="line--vertical_gray" />
                        <div class="info_stage_data__mappool_data">
                            <div class="info_stage_data_text">
                                <div class="info_stage_data_text__title">
                                    KNOCKOUT 1A
                                </div>
                                <div>
                                    <ul>
                                        <li>Nomod (NM): 4 maps</li>
                                        <li>Hidden (HD): 2 maps</li>
                                        <li>Hard Rock (HR): 2 maps</li>
                                        <li>Double Time (DT): 2 maps</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="info_stage_data_button_group">
                                <ContentButton class="qualifiers_button--red qualifiers_button--right_margin_bottom">
                                    MAPPOOL INFO
                                </ContentButton>
                                <ContentButton class="qualifiers_button--right_margin_bottom qualifiers_button--disabled">
                                    UNAVAILABLE
                                </ContentButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import MatchBox from "../../Assets/components/open/InfoMatchBox.vue";
import InfoData from "../../Assets/components/open/InfoData.vue";
import MatchStatus from "../../Assets/components/open/MatchStatus.vue";

@Component({
    components: {
        ContentButton,
        MatchBox,
        InfoData,
        MatchStatus,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Info extends Vue {

    page: "stage 1" | "stage 2" | "stage 3" | "stage 4" = "stage 1";
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.info {
    width: 75vw;
    align-self: center;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    position: relative;

    &__header {
        font-family: $font-communterssans;
        font-weight: 400;
        font-size: $font-title;
    }

    &_main {
        display: flex;
        flex-direction: row;
        align-items: stretch;
    }
    /* left panel */
    &_desc {
            display: flex;
            flex-direction: column;
            width: 30%;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            margin: 15px 20px 0 0;
            padding: 40px 35px;

            & img {
                width: 100%;
                object-fit: cover;
                overflow: hidden;
            }

            &__text {
                text-align: center;
            }
    }

    &_match {
        margin-top: -10px;
    }
        
    /*right panel */
    &_stages {
        display: flex;
        flex-direction: column;
        width: 70%;   
    }         

    &_stage_selector {
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin: 0 0 10px -10px;
    }

    &_stage_panel {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            padding: 15px;
        
        &--grow {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
            padding: 15px;
        }
    }

     &_stage_title {
        position: relative;
        font-family: $font-communterssans;
        font-size: $font-xxxl;

        &__status {
            position: absolute;
            top: 10px;
            right: 0;
        }

        &--red {
            color: $open-red;
            display: inline;
        }
    }

    &_stage_panel:last-child {
        margin-top: 30px;
    }

    &_stage_data {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        height: 100%;

        &--bottom_padding {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            height: 100%;
            padding-bottom: 20px;
        }

        &__mappool_data {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex-grow: 1;
            padding-left: 20px;
            padding-right: 0;
        }

        &__content {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            padding-right: 20px;
        }

        &__content:last-child {
            padding-left: 20px;
            padding-right: 0;
        }

        &_text {
            padding: 20px 50px 20px 50px;
            display: flex;
            flex-direction: column;
            font-size: $font-lg;

            &__title {
                font-family: $font-ggsans;
                font-weight: 800;
                color: #EBEBEB;
            }

            & ul {
                margin-left: 35px;
                list-style-type: none;
                font-family: $font-ggsans;
                font-weight: 600;
            }

            & ul li {
                position: relative;
            }

            & ul li::before {
                content: "";
                position: absolute;
                top: 50%;
                left: -25px;
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }
        &_mappools_selector {
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
        }

        &_button_group {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin: 0 0 0 -15px;        
        }
    }
}
</style>