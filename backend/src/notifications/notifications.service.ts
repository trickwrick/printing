import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async findAll() {
    return this.notificationModel.find().sort({ createdAt: -1 }).limit(50);
  }

  async markAllRead() {
    await this.notificationModel.updateMany(
      { isRead: false },
      { isRead: true },
    );
    return { message: 'All notifications marked as read' };
  }

  async remove(id: string) {
    await this.notificationModel.findByIdAndDelete(id);
    return { message: 'Notification deleted' };
  }
}
