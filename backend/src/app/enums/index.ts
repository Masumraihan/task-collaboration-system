export const PAYMENT_STATUS = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  REFUNDED: "REFUNDED",
} as const;
export type TPaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export enum SocketEvents {
  // Connection
  CONNECT = "connect",
  DISCONNECT = "disconnect",

  // User Status
  USER_ONLINE = "user:online",
  USER_OFFLINE = "user:offline",

  // Messages
  MESSAGE_SEND = "message:send",
  MESSAGE_RECEIVED = "message:received",
  MESSAGE_EDIT = "message:edit",
  MESSAGE_DELETE = "message:delete",
  MESSAGE_SEEN = "message:seen",
  MESSAGE_GET = "message:get",

  // Typing
  TYPING_START = "typing:start",
  TYPING_STOP = "typing:stop",
  TYPING = "typing",

  // CHATS
  CHAT_CREATED = "chat:created",
  CHAT_UPDATED = "chat:updated",
  CHAT_DELETED = "chat:deleted",
  CHAT_GET = "chat:get",
  CHAT_BLOCK = "chat:block",

  // Errors
  ERROR = "error",
}
