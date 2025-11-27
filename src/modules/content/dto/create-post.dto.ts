import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  topic: string; // Ej: "Cómo usar Interceptors en NestJS"
}
