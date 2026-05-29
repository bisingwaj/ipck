import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { MarkReadDto, BroadcastDto } from './dto/notifications.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes notifications' })
  list(@CurrentUser('id') userId: string) {
    return this.notifications.list(userId);
  }

  @Post('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marque des notifications comme lues' })
  markRead(@CurrentUser('id') userId: string, @Body() dto: MarkReadDto) {
    return this.notifications.markRead(userId, dto);
  }

  @Post('broadcast')
  @Roles('pastor')
  @ApiOperation({ summary: 'Diffuse un push (staff)' })
  broadcast(@Body() dto: BroadcastDto) {
    return this.notifications.broadcast(dto);
  }
}
