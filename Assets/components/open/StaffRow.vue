<template>
    <div class="staff_row">
        <div class="staff_row__title">
            ORGANIZERS
            <slot name="role" />
        </div>
        <div class="staff_row_members">
            <div class="staff_row_members_card">
                <div class="staff_row_members_card__headshot">
                    <img
                        class="staff_row_members_card__headshot" 
                        src="../../img/kaetwo.png"
                    >
                </div>
                <div class="staff_row_members_card_details">  
                    <div class="staff_row_members_card_details__username">
                        kaetwo
                    </div>
                    <div class="staff_row_members_card_details__nationality">
                        <img
                            class="staff_row_members_card_details__nationality__img"
                            src="https://osu.ppy.sh/assets/images/flags/1f1e8-1f1e6.svg"
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class StaffRow extends Vue {
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.staff_row {
    display: flex;
    flex-direction: row;

    background: linear-gradient(0deg, #131313, #131313),
    linear-gradient(0deg, #2B2D2E, #2B2D2E);
    height: 119px;
    
    &__title {
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: $font-ggsans;
        font-size: 17px;
        font-weight: 600;
        line-height: 23px;
        letter-spacing: 0em;
        text-align: center;
        
        color: $open-red;
        
        padding: 25px;
    }

    &_members {
        display: flex;
        align-items: center;
        
        &_card {
            display: flex;
            width: 210px;
            height: 95px;
            flex-direction: row;
            align-items: center;


            border: 1px solid rgba(42, 44, 45, 1);
            
            background: linear-gradient(0deg, #171B1E, #171B1E),
            linear-gradient(0deg, #2A2C2D, #2A2C2D);
            
            &__headshot {
                height: 93px;
                width: 74px;
                border-right: 1px solid $open-red;
            }

            &_details {
                display: flex;
                flex-direction: column;
                padding-left: 10px;

                &__username {
                    font-family: $font-ggsans;
                    font-size: 22px;
                    font-weight: 700;
                    line-height: 29px;
                    letter-spacing: 0em;
                    text-align: left;

                }

                &__nationality {
                    width: 16px;
                    height: 11px;
                }
            }
        }
    }
}
</style>