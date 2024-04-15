import { Schema, Context, type } from "@colyseus/schema";

export type TPlayerOptions = {
  sessionId?: string;
  userId: string;
  name: string;
  avatarUri: string;
};

export class Player extends Schema {
  @type("string") public sessionId: string;
  @type("string") public userId: string;
  @type("string") public name: string;
  @type("string") public avatarUri: string;

  @type("boolean") public isDisconnected: boolean = false;
  @type("boolean") public isReady: boolean = false; // client-controlled
  @type("boolean") public isFinished: boolean = false;

  @type("number") public position: number = null; // client-controlled
  @type("number") public finishedPlace: number = null;

  constructor({ sessionId, userId, avatarUri, name }: TPlayerOptions) {
    super();
    this.sessionId = sessionId;
    this.userId = userId;
    this.name = name;
    this.avatarUri = avatarUri;
  }

  reset() {
    this.isReady = false;
    this.isFinished = false;
    this.position = null;
    this.finishedPlace = null;
  }
}
