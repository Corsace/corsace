<template>
    <div class="qualifiers_button">
        <div class="qualifiers_button_text">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({
    components: {
    },
})

export default class ContentButton extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers_button {
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    background-color: #545454;
    color: #FFFFFF;
    margin: 15px 0px 15px 0px;
    min-height: 30px;
    padding: 5px;

    &:hover, &--active {
            background-color: $open-red;
            color: #181818;
        }

    &_text {
        line-height: 30px;
        vertical-align: middle;
        text-align: center;
        font-weight: 600;
    }
}

.qualifiers_button.right_margin {
    margin: 15px 0px 15px 10px;
}

.qualifiers_button.right_margin_bottom{
    margin: 15px 0px 0px 10px;
}

.qualifiers_button.bottom_margin {
    flex-grow: 0;
    margin: 0px 0px 15px 0px;
}

.qualifiers_button.bottom_margin:last-child {
    margin: 0px 0 0 0;
}

.qualifiers_button.red {
    color: #181818;
    background-color: $open-red;
}

.qualifiers_button.red:hover {
    color: #EBEBEB;
}

.qualifiers_button.disabled {
    cursor: not-allowed;
    color: #545454;
    background-color: rgba(0, 0, 0, 0);
    border: 1px solid #545454
}

.qualifiers_button.disabled:hover {
    cursor: not-allowed;
    color: #545454;
    background-color: rgba(0, 0, 0, 0);
    border: 1px solid #545454
}
</style>