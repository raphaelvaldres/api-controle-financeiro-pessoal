import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { TipoTransacao } from '../tipos-transacao';

export class CriarTransacaoDto {
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor!: number;

  @IsEnum(TipoTransacao)
  tipo!: TipoTransacao;

  @IsString()
  @IsNotEmpty()
  categoria!: string;

  @IsBoolean()
  consumoConsciente!: boolean;
}
