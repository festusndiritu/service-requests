import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { Roles } from '../auth/decorators';
import { AnalyticsService } from './analytics.service';

class AnalyticsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsIn([7, 30, 90])
  days: number = 30;
}

@Roles('ADMIN')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get()
  overview(@Query() { days }: AnalyticsQuery) {
    return this.analytics.overview(days);
  }
}
