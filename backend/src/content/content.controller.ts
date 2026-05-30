import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentCategory } from '@prisma/client';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('content')
@ApiBearerAuth()
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('live')
  @ApiOperation({ summary: 'Contenu en direct courant (ou null)' })
  currentLive() {
    return this.content.currentLive();
  }

  @Get('admin')
  @Roles('pastor')
  @ApiOperation({ summary: 'Liste dashboard — tous statuts (staff)' })
  listAdmin(@Query() query: PaginationQueryDto, @Query('category') category?: ContentCategory) {
    return this.content.listAdmin(query, { category });
  }

  @Get()
  @ApiOperation({ summary: 'Liste des contenus publiés (filtres: category, live, featured)' })
  list(
    @Query() query: PaginationQueryDto,
    @Query('category') category?: ContentCategory,
    @Query('live') live?: string,
    @Query('featured') featured?: string,
  ) {
    return this.content.list(query, {
      category,
      live: live === undefined ? undefined : live === 'true',
      featured: featured === undefined ? undefined : featured === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail contenu' })
  findOne(@Param('id') id: string) {
    return this.content.findOne(id);
  }

  @Post()
  @Roles('pastor')
  @ApiOperation({ summary: 'Crée un contenu (staff)' })
  create(@Body() dto: CreateContentDto) {
    return this.content.create(dto);
  }

  @Patch(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Met à jour un contenu — lien, catégorie, toggle live, statut (staff)' })
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.content.update(id, dto);
  }

  @Delete(':id')
  @Roles('pastor')
  @ApiOperation({ summary: 'Supprime un contenu (staff)' })
  remove(@Param('id') id: string) {
    return this.content.remove(id);
  }
}
