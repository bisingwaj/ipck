import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SermonsService } from './sermons.service';
import { LiveService } from './live.service';
import { CreateSermonDto, UpdateSermonDto, SendAmenDto, UpdateLiveDto } from './dto/sermons.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('sermons')
@ApiBearerAuth()
@Controller('sermons')
export class SermonsController {
  constructor(private readonly sermons: SermonsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des sermons' })
  list(
    @Query() query: PaginationQueryDto,
    @Query('series') series?: string,
    @Query('live') live?: string,
  ) {
    return this.sermons.list(query, {
      series,
      live: live === undefined ? undefined : live === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail sermon' })
  findOne(@Param('id') id: string) {
    return this.sermons.findOne(id);
  }

  @Post()
  @Roles('pastor')
  @ApiOperation({ summary: 'Crée / planifie un sermon (staff)' })
  create(@Body() dto: CreateSermonDto) {
    return this.sermons.create(dto);
  }

  @Patch(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Met à jour un sermon (staff)' })
  update(@Param('id') id: string, @Body() dto: UpdateSermonDto) {
    return this.sermons.update(id, dto);
  }
}

@ApiTags('live')
@ApiBearerAuth()
@Controller('live')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get('current')
  @ApiOperation({ summary: 'Session live courante' })
  current() {
    return this.live.current();
  }

  @Get(':id/amens')
  @ApiOperation({ summary: 'Flux récent des amens' })
  amens() {
    return this.live.getRecentAmens();
  }

  @Post(':id/amen')
  @ApiOperation({ summary: 'Envoie un amen live (débite le wallet)' })
  sendAmen(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: SendAmenDto) {
    return this.live.sendAmen(userId, id, dto);
  }

  @Patch(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Contrôle régie (staff)' })
  patch(@Param('id') id: string, @Body() dto: UpdateLiveDto) {
    return this.live.patch(id, dto);
  }
}
