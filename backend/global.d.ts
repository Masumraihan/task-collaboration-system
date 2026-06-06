import { Server as SocketIOServer } from "socket.io";
import { TTokenUser } from "./src/app/types/common";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      user?: TTokenUser;
    }
  }
  var socketio: SocketIOServer | undefined;
}
