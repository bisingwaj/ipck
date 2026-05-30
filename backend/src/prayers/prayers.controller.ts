import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrayersService } from './prayers.service';
import {
  CreatePrayerDto,
  UpdatePrayerStatusDto,
  RespondPrayerDto,
  CreateEncouragementDto,
} from './dto/prayers.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('prayers')
@ApiBearerAuth()
@Controller('prayers')
export class PrayersController {
  constructor(private readonly prayers: PrayersService) {}

  @Get()
  @ApiOperation({ summary: 'Mur de prière (public)' })
  wall(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.prayers.wall(userId, query);
  }

  // Déclaré avant :id pour la priorité de route
  @Get('queue')
  @Roles('pastor')
  @ApiOperation({ summary: 'File de care (staff)' })
  queue(@Query() query: PaginationQueryDto) {
    return this.prayers.queue(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail prière' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.prayers.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Soumet une prière' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePrayerDto) {
    return this.prayers.create(userId, dto);
  }

  @Post(':id/amen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle « prayed »' })
  amen(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.prayers.toggleAmen(userId, id);
  }

  @Post(':id/encouragements')
  @ApiOperation({ summary: 'Ajoute un mot d\'encouragement' })
  encourage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateEncouragementDto,
  ) {
    return this.prayers.addEncouragement(userId, id, dto);
  }

  @Patch(':id/status')
  @Roles('pastor')
  @ApiOperation({ summary: 'Change le statut (staff)' })
  setStatus(@Param('id') id: string, @Body() dto: UpdatePrayerStatusDto) {
    return this.prayers.setStatus(id, dto);
  }

  @Post(':id/respond')
  @Roles('pastor')
  @ApiOperation({ summary: 'Répond à une prière (staff)' })
  respond(@Param('id') id: string, @Body() dto: RespondPrayerDto) {
    return this.prayers.respond(id, dto);
  }
}
