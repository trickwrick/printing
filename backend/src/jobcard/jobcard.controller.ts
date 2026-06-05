import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobcardService } from './jobcard.service';

@Controller('api/jobcard')
export class JobcardController {
  constructor(private readonly jobcardService: JobcardService) {}

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    try {
      const jobCard = await this.jobcardService.saveOrUpdate(body);
      return jobCard;
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new HttpException(
          { error: 'Job Number already exists' },
          HttpStatus.BAD_REQUEST,
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Save Error: ${message}`);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('plate-used-count')
  async getPlateUsedCount(
    @Query('plateSize') plateSize?: string,
    @Query('editingId') editingId?: string,
  ) {
    try {
      return await this.jobcardService.getPlateUsedCount(plateSize, editingId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('sync-tally-direct')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  syncTallyDirect() {
    throw new HttpException(
      { error: 'Tally sync not implemented' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Get()
  async findAll() {
    try {
      return await this.jobcardService.findAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Fetch Error: ${message}`);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.jobcardService.findOne(id);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.jobcardService.remove(id);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Delete Error: ${message}`);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/price')
  async updatePrice(
    @Param('id') id: string,
    @Body('totalAmount') totalAmount: number,
  ) {
    try {
      return await this.jobcardService.updatePrice(id, totalAmount);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
