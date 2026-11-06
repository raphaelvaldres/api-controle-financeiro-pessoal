import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TipoTransacao } from '../tipos-transacao';

export type TransacaoDocument = HydratedDocument<Transacao>;

@Schema({ timestamps: true, versionKey: false })
export class Transacao {
  @Prop({ type: String, required: true, trim: true })
  descricao!: string;

  @Prop({ type: Number, required: true, min: 0 })
  valor!: number;

  @Prop({ type: String, required: true, enum: Object.values(TipoTransacao) })
  tipo!: TipoTransacao;

  @Prop({ type: String, required: true, trim: true })
  categoria!: string;

  @Prop({ type: Boolean, required: true })
  consumoConsciente!: boolean;
}

export const TransacaoSchema = SchemaFactory.createForClass(Transacao);
