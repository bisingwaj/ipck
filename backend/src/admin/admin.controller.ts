import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ActivityService } from '../activity/activity.service';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('pastor')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly activity: ActivityService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPIs de la vue d’ensemble' })
  overview() {
    return this.admin.overview();
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Métriques d’engagement' })
  engagement() {
    return this.admin.engagement();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Flux d’activité' })
  activity_(@Query() query: PaginationQueryDto) {
    return this.activity.list(query);
  }

  @Get('content/upcoming')
  @ApiOperation({ summary: 'Contenu planifié' })
  upcoming() {
    return this.admin.upcomingContent();
  }
}
