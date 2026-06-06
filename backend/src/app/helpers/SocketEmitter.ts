import { Socket } from "socket.io";

type TSocketResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};
const SocketEmitter = <T>(socket: Socket<any>, emit: string, response: TSocketResponse<T>) => {
  socket.emit(emit, response);
};

export default SocketEmitter;
