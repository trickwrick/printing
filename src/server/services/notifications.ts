import { Notification } from '@/server/models';

export async function findAll() {
  return Notification.find().sort({ createdAt: -1 }).limit(50);
}

export async function markAllRead() {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
}

export async function remove(id: string) {
  await Notification.findByIdAndDelete(id);
  return { message: 'Notification deleted' };
}
