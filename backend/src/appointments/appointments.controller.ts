import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointments.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get('topics')
  @ApiOperation({ summary: 'Sujets de rendez-vous' })
  topics() {
    return this.appointments.listTopics();
  }

  @Get('slots')
  @ApiOperation({ summary: 'Créneaux disponibles' })
  slots(@Query('from') from?: string, @Query('to') to?: string) {
    return this.appointments.slots(from, to);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mes rendez-vous' })
  mine(@CurrentUser('id') userId: string) {
    return this.appointments.mine(userId);
  }

  @Get()
  @Roles('pastor')
  @ApiOperation({ summary: 'Agenda staff' })
  agenda(@Query('from') from?: string, @Query('to') to?: string) {
    return this.appointments.agenda(from, to);
  }

  @Post()
  @ApiOperation({ summary: 'Prend un rendez-vous' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Annule un rendez-vous' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.appointments.cancel(userId, id);
  }

  @Patch(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Met à jour un rendez-vous (staff)' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointments.update(id, dto);
  }
}
