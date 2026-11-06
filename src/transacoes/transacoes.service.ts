import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CriarTransacaoDto } from './dto/criar-transacao.dto';
import { calcularMetricas, MetricasFinanceiras } from './calcular-metricas';
import { Transacao } from './schemas/transacao.schema';
import { TipoTransacao } from './tipos-transacao';

export interface TransacaoResposta {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  consumoConsciente: boolean;
}

export interface ListagemTransacoes {
  historico: TransacaoResposta[];
  metricas: MetricasFinanceiras;
}

@Injectable()
export class TransacoesService {
  constructor(
    @InjectModel(Transacao.name)
    private readonly transacaoModel: Model<Transacao>,
  ) {}

  async criar(dto: CriarTransacaoDto): Promise<TransacaoResposta> {
    const transacao = await this.transacaoModel.create(dto);
    return this.formatarTransacao(transacao);
  }

  async listar(): Promise<ListagemTransacoes> {
    const registros = await this.transacaoModel.find().sort({ _id: -1 }).exec();
    const historico = registros.map((registro) => this.formatarTransacao(registro));

    const metricas = calcularMetricas(historico);
    return { historico, metricas };
  }

  private formatarTransacao(registro: Transacao & { _id: unknown }): TransacaoResposta {
    return {
      id: String(registro._id),
      descricao: registro.descricao,
      valor: registro.valor,
      tipo: registro.tipo,
      categoria: registro.categoria,
      consumoConsciente: registro.consumoConsciente,
    };
  }
}
