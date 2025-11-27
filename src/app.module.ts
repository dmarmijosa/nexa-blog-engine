import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GhostModule } from './modules/ghost/ghost.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { OpenaiModule } from './modules/openai/openai.module';
import { ContentModule } from './modules/content/content.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validate,
    }),
    GhostModule,
    OpenaiModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
