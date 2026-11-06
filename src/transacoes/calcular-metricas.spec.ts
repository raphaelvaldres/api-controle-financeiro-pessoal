import { calcularMetricas } from './calcular-metricas';
import { TipoTransacao } from './tipos-transacao';

describe('calcularMetricas', () => {
  it('retorna os três indicadores zerados sem transações', () => {
    expect(calcularMetricas([])).toEqual({
      saldoTotal: 0,
      totalDespesas: 0,
      totalGastoImpulso: 0,
    });
  });

  it('calcula receitas menos despesas e soma só as despesas por impulso', () => {
    const resultado = calcularMetricas([
      { tipo: TipoTransacao.RECEITA, valor: 3000, consumoConsciente: true },
      { tipo: TipoTransacao.DESPESA, valor: 800, consumoConsciente: true },
      { tipo: TipoTransacao.DESPESA, valor: 65.5, consumoConsciente: false },
      { tipo: TipoTransacao.RECEITA, valor: 50, consumoConsciente: false },
    ]);
    expect(resultado).toEqual({
      saldoTotal: 2184.5,
      totalDespesas: 865.5,
      totalGastoImpulso: 65.5,
    });
  });

  it('não acumula erro com valores monetários decimais', () => {
    expect(calcularMetricas([
      { tipo: TipoTransacao.RECEITA, valor: 0.1, consumoConsciente: true },
      { tipo: TipoTransacao.RECEITA, valor: 0.2, consumoConsciente: true },
    ]).saldoTotal).toBe(0.3);
  });
});
