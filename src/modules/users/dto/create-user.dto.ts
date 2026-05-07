import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'joao.silva@vet.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    minLength: 8,
    description:
      'Mínimo de 8 caracteres, com ao menos 1 letra maiúscula, 1 número e 1 símbolo',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Senha deve conter ao menos 1 letra maiúscula' })
  @Matches(/\d/, { message: 'Senha deve conter ao menos 1 número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Senha deve conter ao menos 1 símbolo' })
  password: string;

  @ApiProperty({ example: '+55 11 98888-7777', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ example: [1, 2], description: 'IDs dos papéis' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  roleIds: number[];
}
