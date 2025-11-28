import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SYSTEM_ROLE, TECH_STACK_RULES } from './prompts.constants';

export interface GeneratedBlogPost {
  title: string;
  contentHtml: string;
  tags: string[];
  excerpt: string;
}

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateTechnicalPost(topic: string): Promise<GeneratedBlogPost> {
    this.logger.log(`📚 Generando tutorial técnico experto sobre: ${topic}`);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // O 'gpt-4-turbo' si prefieres
        temperature: 0.2, // Temperatura muy baja = Alta precisión y respeto a las reglas
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_ROLE}\n\n${TECH_STACK_RULES}`,
          },
          {
            role: 'user',
            content: `
              Write a comprehensive technical blog post about: "${topic}".
              
              CRITICAL INSTRUCTIONS:
              1. The content must be LONG, detailed, and educational (minimum 1000 words logic).
              2. Do not hallucinate imports. Follow the ANGULAR STRICT STANDARDS provided exactly.
              3. Focus on 'Why' and 'How'.
              4. Return ONLY the JSON schema requested.
            `,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'technical_blog_post',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'A catchy, SEO-optimized title.',
                },
                excerpt: {
                  type: 'string',
                  description: 'A short summary (140 chars) for SEO.',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    '5 relevant technical tags (e.g. "Angular", "Signals").',
                },
                contentHtml: {
                  type: 'string',
                  description:
                    'The full blog post in semantic HTML. Use <h2>, <h3>, <p>, <ul>, <li>, and <pre><code>.',
                },
              },
              required: ['title', 'excerpt', 'tags', 'contentHtml'],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(
        completion.choices[0].message.content || '{}',
      ) as GeneratedBlogPost;

      // --- POST-PROCESAMIENTO ---
      // Aseguramos que Ghost resalte la sintaxis correctamente
      // Reemplazamos tags de código genéricos por específicos de TypeScript
      result.contentHtml = result.contentHtml.replace(
        /<code(?! class)/g,
        '<code class="language-typescript"',
      );

      return result;
    } catch (error) {
      this.logger.error('Error generando contenido', error);
      throw error;
    }
  }
}
