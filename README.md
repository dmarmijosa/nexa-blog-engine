<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripción del Proyecto

`nexa-blog-engine` es un motor de generación y publicación de contenido técnico automatizado. Combina:

- OpenAI (modelos GPT) para crear artículos técnicos extensos y estructurados.
- Ghost CMS para almacenar los artículos como borradores (o publicarlos luego manualmente).
- NestJS como framework para organizar la arquitectura en módulos limpios.

El flujo principal: El cliente envía un `topic` -> Se genera un artículo largo con título, excerpt, tags y HTML semántico -> Se envía a Ghost como borrador.

> Nota: La generación de contenido puede tardar entre 20–60 segundos dependiendo del modelo y complejidad del tema.

## Requisitos Previos

1. Node.js 18+ instalado
2. Cuenta y sitio Ghost funcionando (self-host o Ghost(Pro))
3. Clave Admin de Ghost (Formato `<id>:<secret>`)
4. Clave de OpenAI (`OPENAI_API_KEY`)

## Configuración del Proyecto

```bash
$ npm install
```

### Variables de Entorno

Crear un archivo `.env` en la raíz con:

```bash
GHOST_URL=https://tu-sitio-ghost.com
GHOST_ADMIN_KEY=XXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Validación: El archivo `src/config/env.validation.ts` asegura que `GHOST_URL`, `GHOST_ADMIN_KEY` y `OPENAI_API_KEY` existan y tengan formato correcto al arrancar.

### Compilar y Ejecutar

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Arquitectura

| Módulo | Propósito | Exporta |
|--------|-----------|---------|
| `GhostModule` | Provee cliente Admin de Ghost via token DI y servicio para crear posts | `GHOST_ADMIN_API`, `GhostService` |
| `OpenaiModule` | Encapsula llamadas a OpenAI y generación del artículo | `OpenaiService` |
| `ContentModule` | Orquesta el flujo: generar con OpenAI y publicar en Ghost | Controlador `ContentController` |
| `AppModule` | Módulo raíz, carga configuración global y módulos de negocio | — |

### Flujo Interno
1. `ContentController.POST /content/generate` recibe `{ topic }`.
2. `OpenaiService.generateTechnicalPost(topic)` crea JSON tipado (`title`, `excerpt`, `tags`, `contentHtml`).
3. Se post-procesa HTML para añadir clases de lenguaje a `<code>`.
4. `GhostService.createPost(...)` envía el borrador a Ghost.
5. Respuesta al cliente incluye `ghostId`, `url`, `title`, `tags`.

### Token y DI
Para evitar dependencias circulares el token `GHOST_ADMIN_API` vive en `src/modules/ghost/ghost.constants.ts` y se inyecta en `GhostService`.

## Endpoints Principales

### 1. Health / Ejemplo de integración
`GET /test-deploy` – Genera un post de prueba y devuelve metadatos.

### 2. Generar y publicar (borrador)
`POST /content/generate`

Body JSON:
```json
{
  "topic": "Cómo usar Interceptors en NestJS"
}
```

Respuesta (ejemplo):
```json
{
  "success": true,
  "message": "Artículo generado y enviado a borrador",
  "data": {
    "ghostId": "675f2c7d8e4c",
    "url": "https://tu-sitio-ghost.com/p/slug/",
    "title": "Interceptors avanzados en NestJS: Diseño y mejores prácticas",
    "tags": ["NestJS", "Interceptors", "Arquitectura", "Backend", "TypeScript"]
  }
}
```

### Ejemplo curl
```bash
curl -X POST http://localhost:3000/content/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Optimización de señales en Angular 18"}'
```

## Estándares Aplicados

- Validación: DTO `CreatePostDto` con `class-validator`.
- Config: Nunca acceder directamente a `process.env`; se usa `ConfigService`.
- OpenAI: Respuesta forzada a JSON mediante `response_format` y esquema estricto.
- Ghost: Publicación inicial como `draft` para revisión manual.
- HTML: Se fuerza `class="language-typescript"` en bloques `<code>` para mejor highlighting.

## Errores Comunes

- 401 Ghost: Revisar `GHOST_ADMIN_KEY` y permisos Admin.
- 400 OpenAI: Verificar cuota y `OPENAI_API_KEY` válida.
- Tiempo de espera: El endpoint puede tardar; considerar timeout del cliente > 60s.
- Dependencia circular: Ya resuelto moviendo el token a `ghost.constants.ts`.

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deploy / Producción

Recomendaciones:

1. Usar imágenes Docker multistage (Node 20 Alpine) y establecer `NODE_ENV=production`.
2. Asegurar variables de entorno en el entorno de orquestación (Docker, Kubernetes, etc.).
3. Añadir capa de autenticación / API Key antes de exponer `POST /content/generate` públicamente.
4. Monitorizar tiempo de respuesta y añadir cola/asíncronía si el volumen crece.

### Comandos básicos Docker (ejemplo)
```bash
docker build -t nexa-blog-engine .
docker run -p 3000:3000 --env-file .env nexa-blog-engine
```

## Futuras Mejoras

- Autenticación JWT / API Key para proteger endpoints.
- Soporte de publicación directa (`status: published`).
- Programación de posts (scheduled publish).
- Indexado en motor de búsqueda interno.
- Cache de prompts y reutilización.

## Recursos

- NestJS Docs: https://docs.nestjs.com
- Ghost Admin API: https://ghost.org/docs/admin-api/
- OpenAI API: https://platform.openai.com/docs

## Licencia

MIT

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
