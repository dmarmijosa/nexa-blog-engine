import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GhostService } from './ghost.service';
import GhostAdminAPI from '@tryghost/admin-api';
import { GHOST_ADMIN_API } from './ghost.constants';

@Global() // Hacemos el módulo global para no importarlo en todos lados
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: GHOST_ADMIN_API,
      useFactory: (configService: ConfigService) => {
        return new GhostAdminAPI({
          url: configService.get<string>('GHOST_URL'),
          key: configService.get<string>('GHOST_ADMIN_KEY'),
          version: 'v5.0',
        });
      },
      inject: [ConfigService],
    },
    GhostService,
  ],
  exports: [GHOST_ADMIN_API, GhostService],
})
export class GhostModule {}
