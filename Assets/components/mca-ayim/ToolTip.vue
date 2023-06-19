<template>
    <div class="tooltip"><slot name="icon"></slot>
        <span class="tooltiptext"><slot></slot></span>
    </div>
</template>
</script>

<style lang="scss">
.tooltip {
  position: relative;
  display: flex;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 50px;
  background-color: #5BBCFA;
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
  content: " ";
  position: absolute;
  top: 85%; /* At the bottom of the tooltip */
  left: 50%;
  margin-left: -12px;
  border-width: 12px;
  border-style: solid;
  border-color: #5BBCFA transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}
</style>