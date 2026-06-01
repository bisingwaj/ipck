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
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, SendMessageDto, AddMemberDto } from './dto/groups.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des groupes (?mine=true)' })
  list(@CurrentUser('id') userId: string, @Query('mine') mine?: string) {
    return this.groups.list(userId, mine === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail groupe' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groups.findOne(userId, id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejoint le groupe' })
  join(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groups.join(userId, id);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitte le groupe' })
  leave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groups.leave(userId, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Messages du groupe' })
  messages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.groups.messages(userId, id, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoie un message (diffusé en WS)' })
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.groups.sendMessage(userId, id, dto);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marque les messages comme lus' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groups.markRead(userId, id);
  }

  @Post()
  @Roles('pastor')
  @ApiOperation({ summary: 'Crée un groupe (staff)' })
  create(@Body() dto: CreateGroupDto) {
    return this.groups.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour un groupe (leader ou staff)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groups.update(user.id, user.role, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('pastor')
  @ApiOperation({ summary: 'Supprime un groupe et son contenu (staff)' })
  remove(@Param('id') id: string) {
    return this.groups.remove(id);
  }

  // ── Gestion des membres (staff) ──
  @Get(':id/members')
  @Roles('pastor')
  @ApiOperation({ summary: 'Membres du groupe (staff)' })
  members(@Param('id') id: string) {
    return this.groups.listMembers(id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @Roles('pastor')
  @ApiOperation({ summary: 'Ajoute un membre au groupe (staff)' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groups.addMember(id, dto.userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('pastor')
  @ApiOperation({ summary: 'Retire un membre du groupe (staff)' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.groups.removeMember(id, userId);
  }

  // ── Modération de la conversation (staff) ──
  @Get(':id/admin/messages')
  @Roles('pastor')
  @ApiOperation({ summary: 'Conversation du groupe pour modération (staff)' })
  adminMessages(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.groups.messagesForStaff(id, query);
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('pastor')
  @ApiOperation({ summary: 'Supprime un message du groupe (staff)' })
  deleteMessage(@Param('id') id: string, @Param('messageId') messageId: string) {
    return this.groups.deleteMessage(id, messageId);
  }
}
