<template>
    <div class="tooltip"><slot name="icon"/>
        <span
            class="tooltiptext"
            :class="`tooltiptext--${site}`">
            <slot />
        </span>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class Tooltip extends Vue {

    @Prop({ type: String, required: true }) readonly site!: string;

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.tooltip {
  position: relative;
  display: flex;
}

.tooltip .tooltiptext {
    &--mca, &--ayim {
      background-color: $alt-blue;
      --set-color: #{$alt-blue};
    }
    &--corsace {
      background-color: $pink;
      --set-color: #{$pink};
    }
    opacity: 0;
    width: 50px;
    color: #fff;
    text-align: center;
    padding: 5px 0px;
    font-size: 11px;
    font-style: normal;
    font-family: "Swis721";
    font-weight: 400;
    line-height: 13px;
    text-align: center;
    
    position: absolute;
    z-index: 1;
    bottom: 33+10px;
    left: 50%;
    margin-left: -30px;
}

.tooltip .tooltiptext::after {
  border-top-color: var(--set-color);

  border-bottom-color: transparent;
  border-left-color: transparent;
  border-right-color: transparent;
  content: " ";
  position: absolute;
  top: 85%; /* At the bottom of the tooltip */
  left: 50%;
  margin-left: -12px;
  border-width: 12px;
  border-style: solid;
}

.tooltip:hover .tooltiptext {
  opacity: 1;
}
</style>
