import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateInterestsDto, RegisterPushTokenDto } from './dto/users.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Met à jour le profil' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Put('me/interests')
  @ApiOperation({ summary: 'Met à jour les centres d’intérêt' })
  updateInterests(@CurrentUser('id') userId: string, @Body() dto: UpdateInterestsDto) {
    return this.users.updateInterests(userId, dto);
  }

  @Get('me/streak')
  @ApiOperation({ summary: 'Streak de lecture' })
  streak(@CurrentUser('id') userId: string) {
    return this.users.streak(userId);
  }

  @Post('me/push-tokens')
  @ApiOperation({ summary: 'Enregistre un token push Expo' })
  registerPush(@CurrentUser('id') userId: string, @Body() dto: RegisterPushTokenDto) {
    return this.users.registerPushToken(userId, dto);
  }

  @Delete('me/push-tokens/:token')
  @ApiOperation({ summary: 'Désenregistre un token push' })
  removePush(@CurrentUser('id') userId: string, @Param('token') token: string) {
    return this.users.removePushToken(userId, token);
  }

  @Get()
  @Roles('pastor')
  @ApiOperation({ summary: 'Liste des membres (staff)' })
  list(@Query() query: PaginationQueryDto) {
    return this.users.list(query);
  }

  @Get('new')
  @Roles('pastor')
  @ApiOperation({ summary: 'Nouveaux membres (signaux People)' })
  newMembers() {
    return this.users.newMembers();
  }
}
