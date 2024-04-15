import { Schema, Context, MapSchema, type } from "@colyseus/schema";
import { Player, TPlayerOptions } from "./Player";
import { type Client, type Room } from "colyseus";

export type TGameState = "waiting" | "countdown" | "in_progress" | "game_over";

export type TPlayerUpdate = {
  isReady?: boolean;
  position?: number;
};

export class ChannelRoomState extends Schema {
  @type("string") public channelId: string; // discord channel id

  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") gameState: TGameState = "waiting";
  @type("string") prompt: string|null = null;

  getPlayerBySessionId(sessionId: string) {
    return Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
  }
  
  addPlayer(sessionId: string, options: TPlayerOptions) {
    const existingPlayer = this.players.get(options.userId);
    if (existingPlayer) {
      existingPlayer.isDisconnected = false;
      existingPlayer.sessionId = sessionId;
      return existingPlayer;
    }

    const player = new Player({ ...options, sessionId });
    this.players.set(options.userId, player);
    return player;
  }

  removePlayer(sessionId: string) {
    const player = this.getPlayerBySessionId(sessionId);
    if (player != null) this.players.delete(player.userId);
  }

  updatePlayer(sessionId: string, { isReady, position }: TPlayerUpdate) {
    const player = this.getPlayerBySessionId(sessionId);
    if (player == null) return;

    if (isReady != undefined && this.gameState === 'waiting') player.isReady = isReady;
    if (position != undefined && this.gameState === 'in_progress') player.position = position;
  }

  checkGameState(room: Room) {
    switch(this.gameState) {
      case 'waiting':
        if (/*this.players.size >= 2 && */Array.from(this.players.values()).every(p => p.isDisconnected || p.isReady)) {
          this.updateGameState(room, 'countdown');
        }
        break;
      case 'countdown':
        break;
      case 'in_progress':
        Array.from(this.players.values()).forEach(p => {
          // check if player is finished
          if (p.position >= this.prompt.split(' ').length) {
            p.isFinished = true;
            p.finishedPlace = Array.from(this.players.values()).filter(p => p.isFinished).length;
          }
        });

        // check if all players are finished
        if (Array.from(this.players.values()).every(p => p.isDisconnected || !p.isReady || p.isFinished)) {
          this.updateGameState(room, 'game_over');
        }
        break;
      case 'game_over':
        break;
    }
  }

  updateGameState(room: Room, newGameState: TGameState) {
    this.gameState = newGameState;
    switch(newGameState) {
      case 'waiting':
        this.prompt = null;

        this.players.forEach(p => {
          if (p.isDisconnected) this.players.delete(p.userId);
          p.isReady = false;
          p.isFinished = false;
          p.position = null;
          p.finishedPlace = null;
        });
        break;
      case 'countdown':
        this.prompt = 'The quick brown fox jumps over the lazy dog.';

        this.players.forEach(p => {
          if (p.isDisconnected && !p.isReady) this.players.delete(p.userId);
          p.isFinished = false;
          p.position = 0;
          p.finishedPlace = null;
        });

        setTimeout(() => this.updateGameState(room, 'in_progress'), 3000);
        break;
      case 'in_progress':
        break;
      case 'game_over':
        setTimeout(() => this.updateGameState(room, 'waiting'), 10000);
        break;
    }

    room.broadcast('game_state', { gameState: newGameState });
  }
}
