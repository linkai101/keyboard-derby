import { Room, Client } from "@colyseus/core";
import { ChannelRoomState, type TPlayerUpdate } from "./schema/ChannelRoomState";
import { type TPlayerOptions } from "./schema/Player";


export class ChannelRoom extends Room<ChannelRoomState> {
  // maxClients = 4;

  onCreate(options: { channelId: string }) {
    if (options.channelId) this.roomId = options.channelId;
    this.setState(new ChannelRoomState());
    this.state.updateGameState(this, "waiting");
    console.log("Channel room created!", options.channelId);

    this.onMessage('player_update', (client, options: TPlayerUpdate) => {
      this.state.updatePlayer(client.sessionId, options);
      this.state.checkGameState(this);
    });
  }

  onJoin(client: Client, options: TPlayerOptions) {
    console.log(options.userId, "joined!");
    this.state.addPlayer(client.sessionId, options);
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.getPlayerBySessionId(client.sessionId);
    console.log(player?.userId, `left! (${consented ? "consented" : "unconsented"})`);
    player.isDisconnected = true; // disconnected players are removed on game reset, allow for rejoining while game in_progress
  }

  onDispose() {
    this.broadcast("room_disposed");
    console.log("room", this.roomId, "disposing...");
  }
}
