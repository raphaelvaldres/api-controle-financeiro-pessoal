(() => {
  'use strict';

  const API_URL = window.location.port === '3000'
    ? '/transacoes'
    : `${window.location.protocol}//${window.location.hostname}:3000/transacoes`;
  const moeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const navButtons = document.querySelectorAll('[data-view]');
  const dashboard = document.getElementById('view-dashboard');
  const formView = document.getElementById('view-form');
  const refreshButton = document.getElementById('refresh-button');
  const apiStatus = document.getElementById('api-status');
  const historyList = document.getElementById('history-list');
  const balanceElement = document.getElementById('metric-balance');
  const expensesElement = document.getElementById('metric-expenses');
  const impulseElement = document.getElementById('metric-impulse');
  const transactionForm = document.getElementById('transaction-form');
  const saveButton = document.getElementById('save-button');
  const formFeedback = document.getElementById('form-feedback');
  const notice = document.getElementById('notice');

  let carregouDados = false;
  let carregandoDados = false;

  function mostrarTela(tela, focarTitulo = true) {
    const verDashboard = tela === 'dashboard';
    dashboard.hidden = !verDashboard;
    formView.hidden = verDashboard;

    navButtons.forEach((button) => {
      const ativa = button.dataset.view === tela;
      button.classList.toggle('is-active', ativa);
      button.setAttribute('aria-pressed', String(ativa));
    });

    if (focarTitulo) {
      const titulo = document.getElementById(verDashboard ? 'dashboard-title' : 'form-title');
      titulo.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function mostrarAviso(mensagem, erro = false) {
    notice.textContent = mensagem;
    notice.classList.toggle('is-error', erro);
    notice.hidden = !mensagem;
  }

  function atualizarMetrica(elemento, valor) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
      throw new Error('A API retornou indicadores financeiros inválidos.');
    }
    elemento.textContent = moeda.format(valor);
    elemento.value = String(valor);
  }

  function criarElemento(tag, className, text) {
    const elemento = document.createElement(tag);
    elemento.className = className;
    if (text !== undefined) elemento.textContent = text;
    return elemento;
  }

  function mostrarEstadoHistorico(titulo, detalhe) {
    const item = criarElemento('li', 'history-placeholder');
    if (titulo) item.appendChild(criarElemento('strong', '', titulo));
    if (detalhe) item.appendChild(criarElemento('span', '', detalhe));
    historyList.replaceChildren(item);
  }

  function montarHistorico(historico) {
    if (historico.length === 0) {
      mostrarEstadoHistorico('Nenhum lançamento por enquanto.', 'Use “Nova transação” para registrar seu primeiro movimento.');
      return;
    }

    const fragment = document.createDocumentFragment();
    historico.forEach((transacao) => {
      const despesa = transacao.tipo === 'despesa';
      const item = criarElemento('li', 'history-item');
      const icone = criarElemento('span', `history-icon${despesa ? ' is-expense' : ''}`, despesa ? '↗' : '↙');
      icone.setAttribute('aria-hidden', 'true');
      const texto = criarElemento('div', 'history-info');
      texto.appendChild(criarElemento('span', 'history-name', transacao.descricao || 'Sem descrição'));

      const tipoTexto = despesa ? 'Despesa' : 'Receita';
      const etiqueta = despesa
        ? (transacao.consumoConsciente === false ? ' · Por impulso' : ' · Consciente')
        : '';
      texto.appendChild(criarElemento('span', 'history-details', `${transacao.categoria || 'Sem categoria'} · ${tipoTexto}${etiqueta}`));

      const quantia = typeof transacao.valor === 'number' && Number.isFinite(transacao.valor)
        ? moeda.format(transacao.valor)
        : 'Valor indisponível';
      const valor = criarElemento('span', `history-value${despesa ? ' is-expense' : ''}`, `${despesa ? '−' : '+'} ${quantia}`);
      item.append(icone, texto, valor);
      fragment.appendChild(item);
    });
    historyList.replaceChildren(fragment);
  }

  async function carregarDados() {
    if (carregandoDados) return;
    carregandoDados = true;
    refreshButton.disabled = true;
    apiStatus.classList.remove('is-error');
    apiStatus.textContent = 'Consultando os dados da API...';

    try {
      const resposta = await fetch(API_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}.`);
      const dados = await resposta.json();
      if (!dados || !dados.metricas || !Array.isArray(dados.historico)) {
        throw new Error('A API não retornou o formato esperado.');
      }

      atualizarMetrica(balanceElement, dados.metricas.saldoTotal);
      atualizarMetrica(expensesElement, dados.metricas.totalDespesas);
      atualizarMetrica(impulseElement, dados.metricas.totalGastoImpulso);
      montarHistorico(dados.historico);
      apiStatus.textContent = 'Dados atualizados diretamente do servidor.';
      carregouDados = true;
    } catch (error) {
      apiStatus.classList.add('is-error');
      apiStatus.textContent = 'Não foi possível acessar a API. Verifique o servidor NestJS e a conexão com o MongoDB.';
      if (!carregouDados) {
        mostrarEstadoHistorico('Não foi possível carregar os lançamentos.', 'Verifique o servidor e toque em “Atualizar” para tentar novamente.');
      }
      console.error('Falha ao consultar GET /transacoes:', error);
    } finally {
      carregandoDados = false;
      refreshButton.disabled = false;
    }
  }

  async function cadastrarTransacao(evento) {
    evento.preventDefault();
    if (saveButton.disabled) return;

    formFeedback.hidden = true;
    const campos = new FormData(transactionForm);
    const descricao = String(campos.get('descricao') || '').trim();
    const categoria = String(campos.get('categoria') || '').trim();
    const valorOriginal = String(campos.get('valor') || '').trim();
    const valor = Number(valorOriginal);
    const tipo = String(campos.get('tipo') || '');
    const respostaConsumo = campos.get('consumoConsciente');

    if (!descricao || !categoria || !Number.isFinite(valor) || valor <= 0 ||
        !['receita', 'despesa'].includes(tipo) || !['true', 'false'].includes(respostaConsumo)) {
      formFeedback.textContent = 'Preencha todos os campos corretamente. O valor deve ser maior que zero.';
      formFeedback.hidden = false;
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(valorOriginal)) {
      formFeedback.textContent = 'Informe um valor com no máximo duas casas decimais.';
      formFeedback.hidden = false;
      return;
    }

    const novaTransacao = {
      descricao,
      valor,
      tipo,
      categoria,
      consumoConsciente: respostaConsumo === 'true',
    };

    saveButton.disabled = true;
    saveButton.querySelector('span').textContent = 'Salvando...';

    try {
      const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(novaTransacao),
      });
      if (!resposta.ok) {
        throw new Error(`A API recusou o cadastro (HTTP ${resposta.status}).`);
      }
      transactionForm.reset();
      mostrarAviso('Transação registrada com sucesso! Seu painel foi atualizado.');
      mostrarTela('dashboard');
      await carregarDados();
    } catch (error) {
      formFeedback.textContent = error.message || 'Não foi possível salvar a transação. Tente novamente.';
      formFeedback.hidden = false;
      console.error('Falha ao enviar POST /transacoes:', error);
    } finally {
      saveButton.disabled = false;
      saveButton.querySelector('span').textContent = 'Salvar transação';
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      mostrarAviso('');
      mostrarTela(button.dataset.view);
    });
  });
  refreshButton.addEventListener('click', carregarDados);
  transactionForm.addEventListener('submit', cadastrarTransacao);
  mostrarTela('dashboard', false);
  void carregarDados();
})();
