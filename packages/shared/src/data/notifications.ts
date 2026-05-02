// Notifications. Phase 1 just logs and stores; Phase 3 wires real push/email.

import { v4 as uuid } from "uuid";

import type { ID, Notification } from "../types";
import { store, nowISO } from "./store";

export async function listNotifications(user_id: ID): Promise<Notification[]> {
  return Array.from(store.notifications.values())
    .filter((n) => n.user_id === user_id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function markRead(notification_id: ID): Promise<Notification> {
  const n = store.notifications.get(notification_id);
  if (!n) throw new Error("Notification not found");
  const updated: Notification = { ...n, read_at: nowISO() };
  store.notifications.set(notification_id, updated);
  return updated;
}

export interface SendNotificationInput {
  user_id: ID;
  type: string;
  title: string;
  body: string;
  link?: string;
}

export async function sendNotification(input: SendNotificationInput): Promise<Notification> {
  const notification: Notification = {
    id: uuid(),
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    created_at: nowISO(),
  };
  store.notifications.set(notification.id, notification);

  // MVP: stub channel — log only. Phase 3: Resend / Expo push / SMS.
  // eslint-disable-next-line no-console
  console.log(`[notification] -> ${input.user_id}: ${input.title}`);

  return notification;
}
