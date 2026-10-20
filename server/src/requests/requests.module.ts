import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [UploadsModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
