import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('status')
  status(): { status: string } {
    return { status: 'ativo' };
  }
}
