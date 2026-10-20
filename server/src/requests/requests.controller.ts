import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser, Public, Roles } from '../auth/decorators';
import { CreateRequestDto, ListQueryDto, TrackQueryDto, UpdateStatusDto } from './requests.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private requests: RequestsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListQueryDto) {
    return this.requests.list(user, query);
  }

  // Must stay above ':id'
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('track')
  track(@Query() query: TrackQueryDto) {
    return this.requests.track(query);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.requests.dashboard(user);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.requests.stats(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requests.findOne(user, id);
  }

  @Roles('CITIZEN')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRequestDto) {
    return this.requests.create(user, dto);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.requests.updateStatus(user, id, dto);
  }
}
