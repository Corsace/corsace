<template>
    <div class="general-info">
        <p>Hello 2020.</p>

        <p>A Year in Mapping has returned for 2019 to bring you etc etc etc</p>

        <p>
            sdasdsadasd<br>
            asdsadsad
        </p>

        <p>
            asdasdsadasdsad<br>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute 
            irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla 
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
            deserunt mollit anim id est laborum
        </p>

        <p>click the icons below to get started</p>
    </div>
</template>


<script>
export default {
    props: {
        selectedMode: {
            type: String,
            default: "standard",
        },
    }, 
};
</script>
<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

.general-info {
    border-radius: 15px 0 0 15px; 
    background-color: rgba(0, 0, 0, 0.8); 
    padding: 30px 70px;
    margin-bottom: 30px;
}
</style>