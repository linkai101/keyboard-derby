<script lang="ts">
  import TextRenderer from './components/TextRenderer.svelte';

  import { onMount } from 'svelte';
  import { discordSdk, setupDiscordSdk, discordAuth, guildMember } from './lib/discord';
  import { getUserAvatarUri } from './utils/getUserAvatarUri';
  import { getUserDisplayName } from './utils/getUserDisplayName';
  import type { Room } from 'colyseus.js';
  import { client, joinChannelRoom } from './lib/colyseus';
  import type { ChannelRoomState, TGameState } from '../../server/src/rooms/schema/ChannelRoomState';
  import type { Player } from '../../server/src/rooms/schema/Player';

  let room: Room<ChannelRoomState>|null = null;
  let me: Player|null = null;
  let players: Player[] = [];
  let gameState: TGameState|null = null;
  let prompt: string|null = null;

  let input: string = '';
  $: {
    if (gameState === 'in_progress' && !me?.isFinished && prompt != null) {
      if (position == null) position = 0;
      // next word check)
      if (input === prompt?.split(' ')[position] + ' '
        || (position === prompt?.split(' ').length-1 && input === prompt?.split(' ')[position]) // last word (without needing trailing space)
      ) {
        position++;
        input = '';
      }
    }
  }
  
  let isReady: boolean = false;
  let position: number|null = null;
  $: {
    if (room) {
      room.send('player_update', { isReady, position });
    }
  }

  onMount(async () => {
    if (!discordAuth) await setupDiscordSdk();
    await joinServer();
  });

  async function joinServer() {
    try {
      if (discordAuth == null) {
        // throw new Error('Discord Auth is not set up!');
        await setupDiscordSdk().then(() => joinServer());
        return;
      }
      if (discordSdk.channelId == null || discordSdk.guildId == null) throw new Error('Channel ID or Guild ID is missing!');
      
      room = await joinChannelRoom(discordSdk.channelId, {
        userId: discordAuth.user.id,
        avatarUri: getUserAvatarUri({ guildMember, user: discordAuth.user }),
        name: getUserDisplayName({ guildMember, user: discordAuth.user }) || discordAuth.user.username,
      });
      console.log("Channel room joined", room.id);

      room.onStateChange.once(state => {
        updateRoom(state, true);
      });

      room.onStateChange((state) => {
        updateRoom(state);
      });

      room.onMessage('game_state', ({ gameState }: { gameState: TGameState }) => {
        // gameState value is updated in the updateRoom function
        gameStateChange(gameState);
      });

      room.onLeave(code => {
        console.log("Channel room left", code);
        room = null;
        clearRoom();
        console.log("Rejoining in 5 seconds...");
        setTimeout(joinServer, 5000);
      });

      room.onMessage('room_disposed', () => {
        console.log("Channel room disposed");
        room = null;
        clearRoom();
        console.log("Rejoining in 5 seconds...");
        setTimeout(joinServer, 5000);
      });
    } catch (error) {
      console.error("Error joining channel room", error);
      if (!room) {
        console.log("Retrying in 5 seconds...");
        setTimeout(joinServer, 5000);
      }
    }
  }

  function updateRoom(state: ChannelRoomState, initial: boolean = false) {
    players = Array.from(state.players.values());
    me = players.find(p => p.userId === discordAuth?.user.id) || null;
    gameState = state.gameState;
    prompt = state.prompt;

    if (initial) {
      isReady = me?.isReady || isReady;
      position = me?.position || position;
    }
  }

  function gameStateChange(newGameState: TGameState) {
    switch(newGameState) {
      case 'waiting':
        isReady = false;
        break;
      case 'countdown':
        input = '';
        position = 0;
        break;
      case 'in_progress':
        input = '';
        position = 0;
        break;
      case 'game_over':
        position = null;
        break;
    }
  }

  function clearRoom() {
    if (room) return;
    players = [];
    me = null;
    gameState = null;
    prompt = null;

    isReady = false;
    position = null;
  }

  function readyUp() {
    isReady = true;
  }
</script>

<main class="h-screen flex flex-col text-neutral-50 bg-neutral-800">
  {#if room}
    <p class="fixed top-0 px-2 text-sm italic text-neutral-500">
      Room ID: {room.id} | Game state: {gameState}
    </p>
  {:else}
    <p class="fixed top-0 px-2 text-sm italic text-neutral-500">
      Not connected
    </p>
  {/if}

  <div class="flex-1 flex flex-col justify-center">
    <div class="bg-neutral-800 text-neutral-50 border-b-4 border-neutral-700">
      {#each players.filter(p => !p.isDisconnected) as player (player.userId)}
        <div class="h-12 flex items-center gap-2 border-t-4 border-neutral-700">
          <p class="pl-4 text-blue-300 text-lg italic font-bold">
            {#if player.isReady}
              {player.name} ✅ &gt;
            {:else}
              {player.name} &gt;
            {/if}
          </p>

          {#if gameState === 'waiting'}
            {#if player.isReady}
              <p class="text-green-300 font-semibold uppercase italic">Ready</p>
          {/if}
          {:else if player.isFinished}
            🏁 #{player.finishedPlace}
          {:else if !player.isReady}
            <p class="text-neutral-600 font-semibold uppercase italic">Spectator</p>
          {:else}
            <p>{player.position != null ? player.position+1 : -1}/{prompt?.split(' ').length}</p>
          {/if}
          </div>
      {/each}
    </div>
  </div>

  <div class="relative bg-neutral-700">
    {#if gameState === 'waiting'}
      <!-- <textarea
        class="h-48 w-full px-6 pt-6 pb-12 text-lg font-medium bg-transparent resize-none focus:outline-none"
        spellCheck="false"
        bind:value={input}
      /> -->
      {#if isReady}
        <p class="absolute -top-8 left-1/2 -translate-x-1/2 text-neutral-300 italic">
          Waiting for the others...
        </p>
      {:else}
        <button
          class="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 text-lg uppercase font-bold text-green-300 bg-green-900 hover:bg-green-900/75 rounded-md transition-colors duration-300"
          on:click={readyUp}
        >
          I&apos;m ready!
        </button>
      {/if}
    {:else if gameState === 'in_progress' && me?.isReady && !me?.isFinished}
      <TextRenderer
        input={input}
        prompt={prompt}
        currentWordIndex={position || 0}
      />

      <textarea
        class="opacity-0 absolute inset-0 resize-none"
        spellCheck="false"
        bind:value={input}
      />
    {:else if gameState === 'in_progress' && me?.isFinished}
      <div/>
    {:else if gameState === 'game_over'}
      <div/>
    {/if}
  </div>
</main>

<style>
</style>
