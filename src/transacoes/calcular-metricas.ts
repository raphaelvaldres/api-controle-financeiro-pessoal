import { TipoTransacao } from './tipos-transacao';

export interface TransacaoParaCalculo {
  valor: number;
  tipo: TipoTransacao;
  consumoConsciente: boolean;
}

export interface MetricasFinanceiras {
  saldoTotal: number;
  totalDespesas: number;
  totalGastoImpulso: number;
}

export function calcularMetricas(transacoes: readonly TransacaoParaCalculo[]): MetricasFinanceiras {
  let receitasCentavos = 0;
  let despesasCentavos = 0;
  let impulsoCentavos = 0;

  for (const transacao of transacoes) {
    const centavos = Math.round(transacao.valor * 100);
    if (transacao.tipo === TipoTransacao.RECEITA) {
      receitasCentavos += centavos;
    } else if (transacao.tipo === TipoTransacao.DESPESA) {
      despesasCentavos += centavos;
      if (transacao.consumoConsciente === false) {
        impulsoCentavos += centavos;
      }
    }
  }

  return {
    saldoTotal: (receitasCentavos - despesasCentavos) / 100,
    totalDespesas: despesasCentavos / 100,
    totalGastoImpulso: impulsoCentavos / 100,
  };
}
