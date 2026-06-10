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

  // ── Gestion des membres (staff ou leader du groupe) ──
  @Get(':id/members')
  @ApiOperation({ summary: 'Membres du groupe (staff ou leader du groupe)' })
  members(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.groups.listMembers(id, user.id, user.role);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajoute un membre au groupe (staff ou leader du groupe)' })
  addMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groups.addMember(id, user.id, user.role, dto.userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retire un membre du groupe (staff ou leader du groupe)' })
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.groups.removeMember(id, user.id, user.role, userId);
  }

  // ── Modération de la conversation (staff ou leader du groupe) ──
  @Get(':id/admin/messages')
  @ApiOperation({ summary: 'Conversation du groupe pour modération (staff ou leader du groupe)' })
  adminMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.groups.messagesForStaff(id, user.id, user.role, query);
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un message du groupe (staff ou leader du groupe)' })
  deleteMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.groups.deleteMessage(id, user.id, user.role, messageId);
  }
}
