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
import { DevotionalsService } from './devotionals.service';
import { CreateDevotionalDto, UpdateDevotionalDto } from './dto/devotionals.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('devotionals')
@ApiBearerAuth()
@Controller('devotionals')
export class DevotionalsController {
  constructor(private readonly devotionals: DevotionalsService) {}

  @Get('today')
  @ApiOperation({ summary: 'Dévotion du jour' })
  today(@CurrentUser('id') userId: string) {
    return this.devotionals.today(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Historique des dévotions' })
  list(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.devotionals.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail dévotion' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.devotionals.findOne(userId, id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marque lu + met à jour le streak' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.devotionals.markRead(userId, id);
  }

  @Post()
  @Roles('pastor')
  @ApiOperation({ summary: 'Crée une dévotion (staff)' })
  create(@Body() dto: CreateDevotionalDto) {
    return this.devotionals.create(dto);
  }

  @Patch(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Met à jour / planifie (staff)' })
  update(@Param('id') id: string, @Body() dto: UpdateDevotionalDto) {
    return this.devotionals.update(id, dto);
  }

  @Delete(':id')
  @Roles('pastor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un brouillon (staff)' })
  remove(@Param('id') id: string) {
    return this.devotionals.remove(id);
  }
}
