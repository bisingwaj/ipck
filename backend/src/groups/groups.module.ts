import { Module } from '@nestjs/common';
import { SermonsModule } from '../sermons/sermons.module';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

@Module({
  imports: [SermonsModule],
  providers: [GroupsService],
  controllers: [GroupsController],
})
export class GroupsModule {}
