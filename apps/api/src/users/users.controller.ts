import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.service.findById(user.sub);
  }

  @Patch('me')
  update(@CurrentUser() user: { sub: string }, @Body() body: { nombre?: string; apellidos?: string }) {
    return this.service.updateProfile(user.sub, body);
  }

  @Patch('me/password')
  changePassword(@CurrentUser() user: { sub: string }, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.service.changePassword(user.sub, body.currentPassword, body.newPassword);
  }
}
