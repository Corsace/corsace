<template>
    <div class="staff_row">
        <div class="staff_row__title">
            <slot name="role" />
        </div>
        <div class="staff_row_members">
            <div class="staff_row_members_card">
                <div class="staff_row_members_card__headshot">
                    HEADSHOT
                </div>
                <div class="staff_row_members_card_details">
                    <div class="staff_row_members_card_details__username">kaetwo</div>
                    <div class="staff_row_members_card_details__nationality">CAN</div>
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

    &__title {
        font-family: $font-ggsans;
        font-size: 17px;
        font-weight: 600;
        line-height: 23px;
        letter-spacing: 0em;
        text-align: center;

    }

    &_members {
        &_card {
            &__headshot {

            }

            &_details {
                &__username {

                }

                &__nationality {

                }
            }
        }
    }
}
</style>