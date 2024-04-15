<script lang="ts">
  export let input: string;
  export let prompt: string|null;
  export let currentWordIndex: number;

  let past: string = '';
  let currentWord: string = '';
  let future: string = '';
  $: {
    if (prompt && currentWordIndex >= 0 && currentWordIndex < prompt.split(' ').length) {
      currentWord = prompt.split(' ')[currentWordIndex];
      past = prompt.split(' ').slice(0, currentWordIndex).join(' ') + ' ';
      future = ' ' + prompt.split(' ').slice(currentWordIndex+1).join(' ');
    }
  }
</script>

<p class="px-6 pt-6 pb-12 text-lg font-medium select-none">
  <span class="opacity-50">{past}</span>
  <span class="underline">
    <span class="opacity-50">{input}</span>{currentWord.slice(input.length)}
  </span>
  <span class="">{future}</span>
  <!-- {prompt || "Loading...■"} -->
</p>
