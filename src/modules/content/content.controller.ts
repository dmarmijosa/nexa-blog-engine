import {
  Body,
  Controller,
  HttpException,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { GhostService } from '../ghost/ghost.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('content')
export class ContentController {
  constructor(
    private readonly openAIService: OpenaiService,
    private readonly ghostService: GhostService,
  ) {}

  @Post('generate')
  async generateAndPublish(@Body() createPostDto: CreatePostDto) {
    try {
      // 1. Generar contenido (Paso lento, puede tardar 30-60 seg)
      const aiContent = await this.openAIService.generateTechnicalPost(
        createPostDto.topic,
      );

      // 2. Publicar en Ghost
      const ghostPost = await this.ghostService.createPost(
        aiContent.title,
        aiContent.contentHtml,
        aiContent.tags,
      );

      // 3. Responder al cliente
      return {
        success: true,
        message: 'Artículo generado y enviado a borrador',
        data: {
          ghostId: ghostPost.id,
          url: ghostPost.url,
          title: aiContent.title,
          tags: aiContent.tags,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Error en el flujo de generación de contenido: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
