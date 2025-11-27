import { Controller, Get } from '@nestjs/common';
import { GhostService } from './modules/ghost/ghost.service';

@Controller()
export class AppController {
  constructor(private readonly ghostService: GhostService) {}

  @Get('test-deploy')
  async testGhostIntegration() {
    const htmlContent = `
      <h2>¡Hola mundo desde NestJS!</h2>
      <p>Si estás leyendo esto, la arquitectura funciona correctamente.</p>
      <ul>
        <li>Docker: OK</li>
        <li>Cloudflare Tunnel: OK</li>
        <li>NestJS API: OK</li>
        <li>Ghost Integration: OK</li>
      </ul>
      <p>Fecha de creación: ${new Date().toISOString()}</p>
    `;

    // Llamamos al servicio para crear el post
    const post = await this.ghostService.createPost(
      'Integración Exitosa: NestJS + Ghost',
      htmlContent,
      ['Prueba', 'DevOps'],
    );

    return {
      message: 'Post creado con éxito en Ghost',
      postId: post.id,
      url: post.url,
      status: post.status,
    };
  }
}
