import { Client } from "colyseus.js";
import type { ChannelRoomState } from '../../../server/src/rooms/schema/ChannelRoomState';

export const client: Client = new Client(`wss://${location.host}/api`);

export async function joinChannelRoom(channelId: string, options: { userId: string, avatarUri: string, name: string }) {
  return await client.joinOrCreate<ChannelRoomState>('channel_room', {
    channelId,
    userId: options.userId,
    avatarUri: options.avatarUri,
    name: options.name,
  });
}