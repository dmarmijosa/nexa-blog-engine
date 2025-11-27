import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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
    this.logger.log(`Generando contenido técnico sobre: ${topic}`);

    const prompt = `
      Eres un Senior Technical Writer y Developer Expert en NestJS, Angular e Ionic.
      Tu tarea es escribir un tutorial técnico avanzado y práctico.
      
      Tema: "${topic}"

      REQUISITOS DEL CONTENIDO:
      1. Profundidad técnica: No expliques qué es una variable. Explica patrones de diseño, inyección de dependencias, señales (signals), etc.
      2. Código: Usa ejemplos de código extensos y bien comentados.
      3. Estructura HTML: El campo 'contentHtml' debe ser HTML válido listo para Ghost (usa <h2>, <p>, <pre><code>...).
      4. Tono: Profesional, directo y educativo.
    `;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Usamos el modelo optimizado para esquemas
      messages: [
        {
          role: 'system',
          content:
            'Eres un motor de generación de blogs técnicos que responde exclusivamente en JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'blog_post_schema',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description:
                  'Un título atractivo optimizado para SEO (max 60 caracteres)',
              },
              excerpt: {
                type: 'string',
                description:
                  'Un resumen corto de 2 lineas para la meta description',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description:
                  "5 etiquetas técnicas relevantes (ej: 'NestJS', 'Middleware')",
              },
              contentHtml: {
                type: 'string',
                description:
                  'El cuerpo del artículo en HTML. IMPORTANTE: Los bloques de código deben ir en <pre><code class="language-typescript">...</code></pre>',
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

    // Pequeño ajuste para que PrismJS (resaltador de código) funcione bien en Ghost
    // A veces la IA olvida la clase specific para el lenguaje
    result.contentHtml = result.contentHtml.replace(
      /<code(?! class)/g,
      '<code class="language-typescript"',
    );
    return result;
  }
}
