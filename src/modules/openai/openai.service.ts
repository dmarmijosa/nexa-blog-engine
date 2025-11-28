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

  // REGLAS ANGULAR (Tu MCP)
  private readonly ANGULAR_RULES = `
    ## Angular Best Practices (STRICT COMPLIANCE REQUIRED)
    - Source of Truth: https://angular.dev/overview
    - Always use standalone components over NgModules.
    - Must NOT set 'standalone: true' inside Angular decorators. It's the default in Angular v19+.
    - Use signals for state management.
    - Implement lazy loading for feature routes.
    - Do NOT use @HostBinding and @HostListener. Put host bindings inside the 'host' object of the @Component decorator.
    - Use NgOptimizedImage for all static images.
    - Components: Use input() and output() functions instead of decorators.
    - Use computed() for derived state.
    - Set changeDetection: ChangeDetectionStrategy.OnPush.
    - Prefer Reactive forms.
    - Do NOT use ngClass/ngStyle, use class/style bindings.
    - Templates: Use native control flow (@if, @for, @switch). NO *ngIf or *ngFor.
    - Services: Use inject() instead of constructor injection.
  `;

  // REGLAS NESTJS
  private readonly NESTJS_RULES = `
    ## NestJS Best Practices (STRICT COMPLIANCE REQUIRED)
    - Source of Truth: https://docs.nestjs.com/
    - Architecture: Modular, Controllers, Services.
    - Dependency Injection: Use standard constructor injection or proper decorators.
    - DTOs: Always use class-validator and class-transformer.
    - Config: Use ConfigService, never process.env directly.
  `;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateTechnicalPost(topic: string): Promise<GeneratedBlogPost> {
    this.logger.log(`Generando contenido técnico AVANZADO sobre: ${topic}`);

    const prompt = `
      Eres un Principal Software Engineer y Technical Writer experto.
      
      TEMA DEL ARTÍCULO: "${topic}"

      INSTRUCCIONES MAESTRAS:
      1. **Fuentes Oficiales**: Basa todo el código EXCLUSIVAMENTE en las reglas proporcionadas abajo. Si el código es obsoleto (ej: usar *ngIf), serás penalizado.
      2. **Profundidad**: Explica el "Por qué", no solo el "Cómo".
      3. **Diagramas SVG**: Si el concepto es arquitectónico o de flujo de datos, GENERA un código <svg> limpio y responsive dentro del HTML para ilustrarlo. El SVG debe tener estilos inline simples.
      4. **Formato**: HTML válido para Ghost (<h2>, <p>, <pre><code class="language-typescript">).

      ${this.ANGULAR_RULES}

      ${this.NESTJS_RULES}
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        // NOTA: 'gpt-5.1' no existe públicamente aún.
        // Si tienes acceso alfa úsalo, si no, usa 'gpt-4o' o 'o1-preview' para mejor razonamiento.
        model: 'gpt-4o', // He puesto gpt-4o para asegurar que funcione, cambia a 'gpt-5.1' si tienes acceso.
        messages: [
          {
            role: 'system',
            content:
              'Eres un motor de generación de blogs técnicos estricto. Respondes exclusivamente en JSON siguiendo el esquema dado.',
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
                  description: 'Título SEO optimizado (max 60 chars)',
                },
                excerpt: {
                  type: 'string',
                  description: 'Resumen para meta description',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Etiquetas técnicas (ej: Angular, Signals)',
                },
                contentHtml: {
                  type: 'string',
                  description:
                    'El artículo en HTML. Incluye diagramas <svg> si es necesario. Bloques de código en <pre><code class="language-typescript">',
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

      // Sanitización y corrección de clases para PrismJS en Ghost
      result.contentHtml = result.contentHtml
        .replace(/<code(?! class)/g, '<code class="language-typescript"')
        // Aseguramos que los SVG sean responsive
        .replace(
          /<svg /g,
          '<svg style="width:100%; height:auto; max-width:600px; display:block; margin: 20px auto;" ',
        );

      return result;
    } catch (error) {
      this.logger.error('Error generando contenido con OpenAI', error);
      throw error;
    }
  }
}
