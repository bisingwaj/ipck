import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('reference')
@Controller('reference')
export class ReferenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('service-times')
  @ApiOperation({ summary: 'Horaires de service' })
  serviceTimes() {
    return this.prisma.serviceTime.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Public()
  @Get('about')
  @ApiOperation({ summary: 'À propos / contact IPCK' })
  about() {
    return {
      org: 'International Protestant Church of Kinshasa',
      short: 'IPCK',
      campus: 'Main campus · Kinshasa, DRC',
      mission:
        'A community following Jesus together — worship, the Word, and care for one another.',
      contact: {
        email: 'hello@ipck.cd',
        phone: '+243 800 000 000',
        address: 'Kinshasa, DRC',
      },
    };
  }
}
