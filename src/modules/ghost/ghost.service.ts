import { Inject, Injectable, Logger } from '@nestjs/common';
import { GHOST_ADMIN_API } from './ghost.constants';

@Injectable()
export class GhostService {
  private readonly logger = new Logger(GhostService.name);

  constructor(@Inject(GHOST_ADMIN_API) private readonly ghostClient: any) {}

  async createPost(title: string, htmlContent: string, tags: string[] = []) {
    try {
      this.logger.log(`📥 Preparando envío a Ghost: ${title}`);

      // Mantenemos tu log de verificación
      this.logger.debug(
        `HTML recibido (inicio): ${htmlContent.substring(0, 50)}...`,
      );

      // --- CAMBIO IMPORTANTE AQUÍ ---
      const response = await this.ghostClient.posts.add(
        {
          title: title,
          html: htmlContent,
          status: 'draft',
          tags: tags.map((tag) => ({ name: tag })),
        },
        // ARGUMENTO MÁGICO: source: 'html'
        // Esto fuerza a Ghost a procesar el HTML en el servidor (Server-Side)
        // en lugar de intentar convertirlo en tu NestJS.
        { source: 'html' },
      );

      this.logger.log(`✅ Post creado con éxito en Ghost. ID: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Error publicando en Ghost: ${error.message}`);
      if (error.context) {
        this.logger.error(`Detalles Ghost: ${JSON.stringify(error.context)}`);
      }
      throw error;
    }
  }
}
