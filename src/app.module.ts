import { Module } from '@nestjs/common';
import { GetawayModule } from './geteway/geteway.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [GetawayModule],
  controllers: [],
  providers: [],  
})
export class AppModule {}
