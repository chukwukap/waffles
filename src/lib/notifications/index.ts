// Types
export type {
  SendResult,
  BatchResult,
  UserFilter,
  NotificationPayload,
  WebhookEventType,
  NotificationDetails,
  UserWithTokens,
} from "./types";

// Token management
export {
  saveToken,
  deleteToken,
  getTokensForUser,
  getUsersWithTokens,
  countUsersWithTokens,
} from "./tokens";

// Sending
export { sendToUser } from "./send";
export { sendBatch, type BatchTarget } from "./batch";

// Webhook
export { handleWebhookEvent, sendWelcomeNotification } from "./webhook";

// Templates
export {
  preGame,
  liveGame,
  postGame,
  onboarding,
  transactional,
  retention,
  growth,
  buildPayload,
  type NotificationTemplate,
  type NotificationContext,
} from "./templates";

// Constants
export { LOG_PREFIX } from "./constants";
