import { Module } from '@nestjs/common';
import { OpenaiModule } from '../openai/openai.module';
import { GhostModule } from '../ghost/ghost.module';
import { ContentController } from './content.controller';

@Module({
  imports: [OpenaiModule, GhostModule],
  controllers: [ContentController],
})
export class ContentModule {}
