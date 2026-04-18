<script>
  import debounce from "lodash.debounce";
  import { onMount } from "svelte";
  import { windowWidth, windowHeight } from "../stores/global.js";

  /**
   * @typedef {Object} Props
   * @property {number} [debounceDur]
   */

  /** @type {Props} */
  let { debounceDur = 100 } = $props();

  const onResize = () => {
    $windowWidth = window.innerWidth;
    $windowHeight = window.innerHeight;
  };

  onMount(() => {
    onResize();
  });
</script>

<svelte:window onresize={debounce(onResize, debounceDur)} />
