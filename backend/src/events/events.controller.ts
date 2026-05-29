import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, RsvpDto } from './dto/events.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des événements' })
  list(@CurrentUser('id') userId: string) {
    return this.events.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail événement' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.events.findOne(userId, id);
  }

  @Post(':id/rsvp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'RSVP à un événement' })
  rsvp(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: RsvpDto) {
    return this.events.rsvp(userId, id, dto);
  }

  @Post()
  @Roles('pastor')
  @ApiOperation({ summary: 'Crée un événement (staff)' })
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Patch(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Met à jour un événement (staff)' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }
}
