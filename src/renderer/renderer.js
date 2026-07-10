'use strict';

// ======================================================================
// Estado global e utilidades
// ======================================================================
const Calc = window.Calc;
let state = { meta: { versao: 1 }, leiloes: [], clientes: [], lotes: [], lances: [] };
let currentView = 'painel';
let activeLeilaoId = null;
let search = '';

const fmtBRL = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (n) => `${(Number(n) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR');
};
const uid = () => 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

async function persist() {
  try {
    await window.api.save(state);
  } catch (e) {
    toast('Erro ao salvar.');
  }
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// Helpers de acesso ao estado -----------------------------------------
const getLeilao = (id) => state.leiloes.find((l) => l.id === id) || null;
const getCliente = (id) => state.clientes.find((c) => c.id === id) || null;
const lotesDoLeilao = (id) => state.lotes.filter((l) => l.leilaoId === id);
const clienteNome = (id) => {
  const c = getCliente(id);
  return c ? c.nome : '—';
};

// ======================================================================
// Boot
// ======================================================================
async function boot() {
  state = await window.api.load();
  // Normaliza coleções
  for (const k of ['leiloes', 'clientes', 'lotes', 'lances']) {
    if (!Array.isArray(state[k])) state[k] = [];
  }
  if (!activeLeilaoId && state.leiloes[0]) activeLeilaoId = state.leiloes[0].id;

  bindNav();
  bindTopbar();
  bindFooter();
  render();
}

function bindNav() {
  $$('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      search = '';
      $$('.nav-item').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });
}

function bindTopbar() {
  const sel = $('#sel-leilao');
  sel.addEventListener('change', () => {
    activeLeilaoId = sel.value || null;
    render();
  });
}

function bindFooter() {
  $('#btn-export').addEventListener('click', async () => {
    const r = await window.api.exportBackup(state);
    if (r && r.ok) toast('Backup exportado.');
  });
  $('#btn-import').addEventListener('click', async () => {
    const r = await window.api.importBackup();
    if (r && r.ok && r.data) {
      state = r.data;
      for (const k of ['leiloes', 'clientes', 'lotes', 'lances']) {
        if (!Array.isArray(state[k])) state[k] = [];
      }
      activeLeilaoId = state.leiloes[0] ? state.leiloes[0].id : null;
      await persist();
      render();
      toast('Backup importado.');
    } else if (r && r.erro) {
      toast(r.erro);
    }
  });
}

// ======================================================================
// Render principal
// ======================================================================
function render() {
  renderAuctionPicker();
  const view = $('#view');
  const map = {
    painel: viewPainel,
    leiloes: viewLeiloes,
    lotes: viewLotes,
    clientes: viewClientes,
    lances: viewLances,
    financeiro: viewFinanceiro,
  };
  view.innerHTML = (map[currentView] || viewPainel)();
  wireView();
  updateStatus();
}

function renderAuctionPicker() {
  const sel = $('#sel-leilao');
  if (!state.leiloes.length) {
    sel.innerHTML = `<option value="">Nenhum leilão</option>`;
    sel.value = '';
    return;
  }
  sel.innerHTML = state.leiloes
    .map((l) => `<option value="${l.id}">${esc(l.nome)}</option>`)
    .join('');
  if (!activeLeilaoId || !getLeilao(activeLeilaoId)) activeLeilaoId = state.leiloes[0].id;
  sel.value = activeLeilaoId;
}

function updateStatus() {
  const l = getLeilao(activeLeilaoId);
  const el = $('#topbar-status');
  if (!l) {
    el.textContent = `${state.leiloes.length} leilões · ${state.clientes.length} arrematantes`;
    return;
  }
  const n = lotesDoLeilao(l.id).length;
  el.textContent = `${esc(l.nome)} · ${n} lote(s) · ${fmtDate(l.data)}`;
}

function requireLeilao(titulo) {
  return `<div class="page-head"><div><h1>${titulo}</h1></div></div>
    <div class="card"><div class="empty">Nenhum leilão selecionado.<br/>
    Crie um leilão na aba <strong>Leilões</strong> para começar.</div></div>`;
}

// ======================================================================
// VIEW: Painel
// ======================================================================
function viewPainel() {
  const l = getLeilao(activeLeilaoId);
  if (!l) {
    return `<div class="page-head"><div><h1>Painel</h1>
      <p>Visão geral do leilão ativo.</p></div>
      <button class="btn" data-action="novo-leilao">+ Novo leilão</button></div>
      <div class="card"><div class="empty">Bem-vindo ao <strong>Entre Colunas Leilões</strong>.<br/>
      Comece criando seu primeiro leilão.</div></div>`;
  }
  const lotes = lotesDoLeilao(l.id);
  const resumo = Calc.resumoLeilao(l, lotes);
  const compradores = Calc.contasCompradores(l, lotes, state.clientes);

  const stat = (label, value, cls = '', sub = '') => `
    <div class="stat"><div class="label">${label}</div>
    <div class="value ${cls}">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;

  const topRows = compradores.slice(0, 5).map((c) => `
    <tr><td>${esc(c.nome)}</td><td class="num">${c.lotes}</td>
    <td class="num">${fmtBRL(c.martelo)}</td><td class="num">${fmtBRL(c.total)}</td></tr>`).join('');

  return `
    <div class="page-head">
      <div><h1>Painel — ${esc(l.nome)}</h1>
      <p>${fmtDate(l.data)}${l.local ? ' · ' + esc(l.local) : ''}
        · <span class="badge ${l.status || 'rascunho'}">${labelStatusLeilao(l.status)}</span></p></div>
      <button class="btn" data-action="registrar-lance">+ Registrar lance</button>
    </div>

    <div class="stat-grid">
      ${stat('Total em martelo', fmtBRL(resumo.martelo), 'gold')}
      ${stat('Receita do leiloeiro', fmtBRL(resumo.receitaLeiloeiro), 'green')}
      ${stat('Lotes vendidos', `${resumo.lotesVendidos}/${resumo.lotesTotal}`, '', `Taxa de venda ${fmtPct(resumo.taxaVenda)}`)}
      ${stat('Repasse a vendedores', fmtBRL(resumo.repasseVendedor))}
      ${stat('A receber (compradores)', fmtBRL(resumo.totalComprador))}
      ${stat('Arrematantes', String(compradores.length))}
    </div>

    <div class="card">
      <h2>Maiores arrematantes</h2>
      ${compradores.length ? `<table><thead><tr>
        <th>Arrematante</th><th class="num">Lotes</th><th class="num">Martelo</th><th class="num">Total a pagar</th>
      </tr></thead><tbody>${topRows}</tbody></table>`
      : `<div class="empty">Nenhum lote arrematado ainda.</div>`}
    </div>`;
}

function labelStatusLeilao(s) {
  return { rascunho: 'Rascunho', aberto: 'Aberto', encerrado: 'Encerrado' }[s] || 'Rascunho';
}

// ======================================================================
// VIEW: Leilões
// ======================================================================
function viewLeiloes() {
  const rows = state.leiloes.map((l) => {
    const lotes = lotesDoLeilao(l.id);
    const r = Calc.resumoLeilao(l, lotes);
    return `<tr>
      <td><strong>${esc(l.nome)}</strong></td>
      <td>${fmtDate(l.data)}</td>
      <td>${esc(l.local || '—')}</td>
      <td><span class="badge ${l.status || 'rascunho'}">${labelStatusLeilao(l.status)}</span></td>
      <td class="num">${r.lotesVendidos}/${r.lotesTotal}</td>
      <td class="num">${fmtBRL(r.martelo)}</td>
      <td class="num">
        <button class="link-btn" data-action="edit-leilao" data-id="${l.id}">Editar</button>
        <button class="link-btn danger" data-action="del-leilao" data-id="${l.id}">Excluir</button>
      </td></tr>`;
  }).join('');

  return `
    <div class="page-head">
      <div><h1>Leilões</h1><p>Cadastre e configure as comissões de cada evento.</p></div>
      <button class="btn" data-action="novo-leilao">+ Novo leilão</button>
    </div>
    <div class="card">
      ${state.leiloes.length ? `<table><thead><tr>
        <th>Nome</th><th>Data</th><th>Local</th><th>Status</th>
        <th class="num">Vendidos</th><th class="num">Martelo</th><th class="num"></th>
      </tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty">Nenhum leilão cadastrado.</div>`}
    </div>`;
}

// ======================================================================
// VIEW: Lotes
// ======================================================================
function viewLotes() {
  const l = getLeilao(activeLeilaoId);
  if (!l) return requireLeilao('Lotes / Catálogo');

  let lotes = lotesDoLeilao(l.id);
  if (search) {
    const q = search.toLowerCase();
    lotes = lotes.filter((x) =>
      `${x.numero} ${x.titulo} ${x.descricao || ''}`.toLowerCase().includes(q));
  }
  lotes.sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));

  const rows = lotes.map((lo) => {
    const f = lo.status === 'vendido' ? Calc.financeiroLote(lo, l) : null;
    return `<tr>
      <td class="num mono">${esc(lo.numero || '—')}</td>
      <td><strong>${esc(lo.titulo)}</strong>${lo.vendedor ? `<div class="sub" style="color:var(--muted);font-size:11px">Vendedor: ${esc(lo.vendedor)}</div>` : ''}</td>
      <td class="num">${fmtBRL(lo.lanceInicial)}</td>
      <td><span class="badge ${lo.status || 'aberto'}">${labelStatusLote(lo.status)}</span></td>
      <td>${lo.status === 'vendido' ? esc(clienteNome(lo.arrematanteId)) : '—'}</td>
      <td class="num">${f ? fmtBRL(f.martelo) : '—'}</td>
      <td class="num">
        <button class="link-btn" data-action="edit-lote" data-id="${lo.id}">Editar</button>
        <button class="link-btn danger" data-action="del-lote" data-id="${lo.id}">Excluir</button>
      </td></tr>`;
  }).join('');

  return `
    <div class="page-head">
      <div><h1>Lotes / Catálogo</h1><p>Itens do leilão <strong>${esc(l.nome)}</strong>.</p></div>
      <button class="btn" data-action="novo-lote">+ Novo lote</button>
    </div>
    <div class="toolbar">
      <input type="search" id="busca" placeholder="Buscar lote..." value="${esc(search)}" />
      <div class="spacer"></div>
    </div>
    <div class="card">
      ${lotes.length ? `<table><thead><tr>
        <th class="num">Nº</th><th>Título</th><th class="num">Lance inicial</th>
        <th>Status</th><th>Arrematante</th><th class="num">Martelo</th><th class="num"></th>
      </tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty">Nenhum lote${search ? ' encontrado' : ' cadastrado'}.</div>`}
    </div>`;
}

function labelStatusLote(s) {
  return { aberto: 'Aberto', vendido: 'Vendido', nao_vendido: 'Não vendido' }[s] || 'Aberto';
}

// ======================================================================
// VIEW: Clientes / Arrematantes
// ======================================================================
function viewClientes() {
  let clientes = state.clientes.slice();
  if (search) {
    const q = search.toLowerCase();
    clientes = clientes.filter((c) =>
      `${c.nome} ${c.documento || ''} ${c.email || ''} ${c.telefone || ''}`.toLowerCase().includes(q));
  }
  clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const rows = clientes.map((c) => `<tr>
    <td><strong>${esc(c.nome)}</strong></td>
    <td>${esc(c.documento || '—')}</td>
    <td>${esc(c.telefone || '—')}</td>
    <td>${esc(c.email || '—')}</td>
    <td>${esc(rotuloTipo(c.tipo))}</td>
    <td class="num">
      <button class="link-btn" data-action="edit-cliente" data-id="${c.id}">Editar</button>
      <button class="link-btn danger" data-action="del-cliente" data-id="${c.id}">Excluir</button>
    </td></tr>`).join('');

  return `
    <div class="page-head">
      <div><h1>Arrematantes / Clientes</h1><p>Compradores e vendedores cadastrados.</p></div>
      <button class="btn" data-action="novo-cliente">+ Novo cadastro</button>
    </div>
    <div class="toolbar">
      <input type="search" id="busca" placeholder="Buscar por nome, documento..." value="${esc(search)}" />
    </div>
    <div class="card">
      ${clientes.length ? `<table><thead><tr>
        <th>Nome</th><th>Documento</th><th>Telefone</th><th>E-mail</th><th>Tipo</th><th class="num"></th>
      </tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty">Nenhum cadastro${search ? ' encontrado' : ''}.</div>`}
    </div>`;
}

function rotuloTipo(t) {
  return { comprador: 'Comprador', vendedor: 'Vendedor', ambos: 'Comprador e vendedor' }[t] || 'Comprador';
}

// ======================================================================
// VIEW: Lances
// ======================================================================
function viewLances() {
  const l = getLeilao(activeLeilaoId);
  if (!l) return requireLeilao('Lances');

  const loteIds = new Set(lotesDoLeilao(l.id).map((x) => x.id));
  let lances = state.lances.filter((x) => loteIds.has(x.loteId));
  lances.sort((a, b) => (b.dataHora || '').localeCompare(a.dataHora || ''));

  const rows = lances.map((b) => {
    const lote = state.lotes.find((x) => x.id === b.loteId);
    return `<tr>
      <td class="num mono">${esc(lote ? lote.numero : '—')}</td>
      <td>${esc(lote ? lote.titulo : 'Lote removido')}</td>
      <td>${esc(clienteNome(b.arrematanteId))}</td>
      <td class="num">${fmtBRL(b.valor)}</td>
      <td>${b.dataHora ? new Date(b.dataHora).toLocaleString('pt-BR') : '—'}</td>
      <td class="num">
        <button class="link-btn" data-action="apurar-lance" data-id="${b.id}" title="Marcar como arremate vencedor">Apurar vencedor</button>
        <button class="link-btn danger" data-action="del-lance" data-id="${b.id}">Excluir</button>
      </td></tr>`;
  }).join('');

  return `
    <div class="page-head">
      <div><h1>Lances</h1><p>Registro de lances do leilão <strong>${esc(l.nome)}</strong>.</p></div>
      <button class="btn" data-action="registrar-lance">+ Registrar lance</button>
    </div>
    <p class="hint">"Apurar vencedor" marca o lote como vendido para o arrematante do lance, usando o valor do lance como martelo.</p>
    <div class="card">
      ${lances.length ? `<table><thead><tr>
        <th class="num">Lote</th><th>Título</th><th>Arrematante</th>
        <th class="num">Valor</th><th>Data/Hora</th><th class="num"></th>
      </tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty">Nenhum lance registrado.</div>`}
    </div>`;
}

// ======================================================================
// VIEW: Financeiro
// ======================================================================
function viewFinanceiro() {
  const l = getLeilao(activeLeilaoId);
  if (!l) return requireLeilao('Financeiro');

  const lotes = lotesDoLeilao(l.id);
  const resumo = Calc.resumoLeilao(l, lotes);
  const compradores = Calc.contasCompradores(l, lotes, state.clientes);
  const vendidos = lotes.filter(Calc.loteVendido).sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));

  const stat = (label, value, cls = '') =>
    `<div class="stat"><div class="label">${label}</div><div class="value ${cls}">${value}</div></div>`;

  const linhasLotes = vendidos.map((lo) => {
    const f = Calc.financeiroLote(lo, l);
    return `<tr>
      <td class="num mono">${esc(lo.numero || '—')}</td>
      <td>${esc(lo.titulo)}</td>
      <td>${esc(clienteNome(lo.arrematanteId))}</td>
      <td class="num">${fmtBRL(f.martelo)}</td>
      <td class="num">${fmtBRL(f.comissaoComprador)}</td>
      <td class="num">${fmtBRL(f.totalComprador)}</td>
      <td class="num">${fmtBRL(f.comissaoVendedor)}</td>
      <td class="num">${fmtBRL(f.repasseVendedor)}</td>
    </tr>`;
  }).join('');

  const linhasComp = compradores.map((c) => `<tr>
    <td>${esc(c.nome)}</td><td class="num">${c.lotes}</td>
    <td class="num">${fmtBRL(c.martelo)}</td><td class="num">${fmtBRL(c.comissao)}</td>
    <td class="num"><strong>${fmtBRL(c.total)}</strong></td>
  </tr>`).join('');

  return `
    <div class="page-head">
      <div><h1>Financeiro — ${esc(l.nome)}</h1>
      <p>Comissão comprador ${fmtPct(l.comissaoCompradorPct)} · Comissão vendedor ${fmtPct(l.comissaoVendedorPct)}</p></div>
      <button class="btn secondary" data-action="export-csv">Exportar CSV</button>
    </div>

    <div class="stat-grid">
      ${stat('Total em martelo', fmtBRL(resumo.martelo), 'gold')}
      ${stat('Comissão compradores', fmtBRL(resumo.comissaoComprador))}
      ${stat('Comissão vendedores', fmtBRL(resumo.comissaoVendedor))}
      ${stat('Receita do leiloeiro', fmtBRL(resumo.receitaLeiloeiro), 'green')}
      ${stat('A receber (compradores)', fmtBRL(resumo.totalComprador))}
      ${stat('A repassar (vendedores)', fmtBRL(resumo.repasseVendedor))}
    </div>

    <div class="card">
      <h2>Contas a receber por arrematante</h2>
      ${compradores.length ? `<table><thead><tr>
        <th>Arrematante</th><th class="num">Lotes</th><th class="num">Martelo</th>
        <th class="num">Comissão</th><th class="num">Total a pagar</th>
      </tr></thead><tbody>${linhasComp}</tbody></table>`
      : `<div class="empty">Nenhum lote arrematado.</div>`}
    </div>

    <div class="card">
      <h2>Detalhamento por lote vendido</h2>
      ${vendidos.length ? `<table><thead><tr>
        <th class="num">Nº</th><th>Lote</th><th>Arrematante</th>
        <th class="num">Martelo</th><th class="num">Com. compr.</th><th class="num">Total compr.</th>
        <th class="num">Com. vend.</th><th class="num">Repasse vend.</th>
      </tr></thead><tbody>${linhasLotes}</tbody></table>`
      : `<div class="empty">Nenhum lote vendido.</div>`}
    </div>`;
}

// ======================================================================
// Wire de eventos da view (delegação)
// ======================================================================
function wireView() {
  const busca = $('#busca');
  if (busca) {
    busca.addEventListener('input', (e) => {
      search = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const nb = $('#busca');
      if (nb) { nb.focus(); nb.setSelectionRange(pos, pos); }
    });
  }

  $$('[data-action]').forEach((el) => {
    el.addEventListener('click', () => handleAction(el.dataset.action, el.dataset.id));
  });
}

function handleAction(action, id) {
  switch (action) {
    case 'novo-leilao': return modalLeilao();
    case 'edit-leilao': return modalLeilao(getLeilao(id));
    case 'del-leilao': return excluirLeilao(id);
    case 'novo-lote': return modalLote();
    case 'edit-lote': return modalLote(state.lotes.find((x) => x.id === id));
    case 'del-lote': return excluirLote(id);
    case 'novo-cliente': return modalCliente();
    case 'edit-cliente': return modalCliente(getCliente(id));
    case 'del-cliente': return excluirCliente(id);
    case 'registrar-lance': return modalLance();
    case 'del-lance': return excluirLance(id);
    case 'apurar-lance': return apurarVencedor(id);
    case 'export-csv': return exportarCsv();
  }
}

// ======================================================================
// Modal genérico
// ======================================================================
function openModal(html) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
  root.querySelector('.modal-backdrop').addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
  const first = root.querySelector('input, select, textarea');
  if (first) first.focus();
}
function closeModal() {
  $('#modal-root').innerHTML = '';
}
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function numVal(id) {
  const raw = val(id).replace(/\./g, '').replace(',', '.');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

// ---- Modal Leilão ----
function modalLeilao(l) {
  const e = l || {};
  openModal(`
    <h3>${l ? 'Editar leilão' : 'Novo leilão'}</h3>
    <div class="form-grid">
      <div class="field full"><label>Nome do leilão *</label><input id="f-nome" value="${esc(e.nome || '')}" placeholder="Ex.: Leilão de Arte Nº 12" /></div>
      <div class="field"><label>Data</label><input id="f-data" type="date" value="${esc(e.data || '')}" /></div>
      <div class="field"><label>Status</label><select id="f-status">
        ${opt('rascunho', 'Rascunho', e.status)}${opt('aberto', 'Aberto', e.status)}${opt('encerrado', 'Encerrado', e.status)}
      </select></div>
      <div class="field full"><label>Local</label><input id="f-local" value="${esc(e.local || '')}" placeholder="Local / plataforma" /></div>
      <div class="field"><label>Comissão do comprador (%)</label><input id="f-cc" value="${e.comissaoCompradorPct != null ? e.comissaoCompradorPct : 5}" /></div>
      <div class="field"><label>Comissão do vendedor (%)</label><input id="f-cv" value="${e.comissaoVendedorPct != null ? e.comissaoVendedorPct : 0}" /></div>
    </div>
    <div class="modal-actions">
      <button class="ghost" data-close>Cancelar</button>
      <button class="btn" id="salvar">Salvar</button>
    </div>`);
  wireClose();
  $('#salvar').addEventListener('click', async () => {
    const nome = val('f-nome');
    if (!nome) return toast('Informe o nome do leilão.');
    const obj = {
      id: e.id || uid(),
      nome,
      data: val('f-data'),
      local: val('f-local'),
      status: val('f-status') || 'rascunho',
      comissaoCompradorPct: numVal('f-cc'),
      comissaoVendedorPct: numVal('f-cv'),
    };
    if (e.id) {
      Object.assign(getLeilao(e.id), obj);
    } else {
      state.leiloes.push(obj);
      activeLeilaoId = obj.id;
    }
    await persist();
    closeModal();
    render();
    toast('Leilão salvo.');
  });
}

// ---- Modal Lote ----
function modalLote(lo) {
  const e = lo || {};
  const l = getLeilao(activeLeilaoId);
  const clientesOpts = state.clientes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((c) => opt(c.id, c.nome, e.arrematanteId))
    .join('');
  openModal(`
    <h3>${lo ? 'Editar lote' : 'Novo lote'} — ${esc(l ? l.nome : '')}</h3>
    <div class="form-grid">
      <div class="field"><label>Número *</label><input id="f-num" value="${esc(e.numero || '')}" placeholder="Ex.: 001" /></div>
      <div class="field"><label>Lance inicial (R$)</label><input id="f-lini" value="${e.lanceInicial != null ? e.lanceInicial : ''}" placeholder="0,00" /></div>
      <div class="field full"><label>Título *</label><input id="f-titulo" value="${esc(e.titulo || '')}" placeholder="Descrição curta do item" /></div>
      <div class="field full"><label>Descrição</label><textarea id="f-desc" placeholder="Detalhes, estado de conservação, procedência...">${esc(e.descricao || '')}</textarea></div>
      <div class="field"><label>Incremento mínimo (R$)</label><input id="f-inc" value="${e.incremento != null ? e.incremento : ''}" placeholder="0,00" /></div>
      <div class="field"><label>Avaliação (R$)</label><input id="f-aval" value="${e.valorAvaliacao != null ? e.valorAvaliacao : ''}" placeholder="0,00" /></div>
      <div class="field full"><label>Vendedor / consignante</label><input id="f-vend" value="${esc(e.vendedor || '')}" placeholder="Nome do vendedor" /></div>
      <div class="field"><label>Status</label><select id="f-status">
        ${opt('aberto', 'Aberto', e.status)}${opt('vendido', 'Vendido', e.status)}${opt('nao_vendido', 'Não vendido', e.status)}
      </select></div>
      <div class="field"><label>Valor de arremate (R$)</label><input id="f-arr" value="${e.valorArremate != null ? e.valorArremate : ''}" placeholder="0,00" /></div>
      <div class="field full"><label>Arrematante (se vendido)</label><select id="f-arrematante">
        <option value="">— selecione —</option>${clientesOpts}
      </select></div>
    </div>
    <div class="modal-actions">
      <button class="ghost" data-close>Cancelar</button>
      <button class="btn" id="salvar">Salvar</button>
    </div>`);
  wireClose();
  $('#salvar').addEventListener('click', async () => {
    const titulo = val('f-titulo');
    const numero = val('f-num');
    if (!numero) return toast('Informe o número do lote.');
    if (!titulo) return toast('Informe o título do lote.');
    const status = val('f-status') || 'aberto';
    const obj = {
      id: e.id || uid(),
      leilaoId: activeLeilaoId,
      numero,
      titulo,
      descricao: val('f-desc'),
      lanceInicial: numVal('f-lini'),
      incremento: numVal('f-inc'),
      valorAvaliacao: numVal('f-aval'),
      vendedor: val('f-vend'),
      status,
      valorArremate: status === 'vendido' ? numVal('f-arr') : 0,
      arrematanteId: status === 'vendido' ? (val('f-arrematante') || null) : null,
    };
    if (status === 'vendido' && obj.valorArremate <= 0) return toast('Informe o valor de arremate.');
    if (e.id) {
      Object.assign(state.lotes.find((x) => x.id === e.id), obj);
    } else {
      state.lotes.push(obj);
    }
    await persist();
    closeModal();
    render();
    toast('Lote salvo.');
  });
}

// ---- Modal Cliente ----
function modalCliente(c) {
  const e = c || {};
  openModal(`
    <h3>${c ? 'Editar cadastro' : 'Novo arrematante / cliente'}</h3>
    <div class="form-grid">
      <div class="field full"><label>Nome / Razão social *</label><input id="f-nome" value="${esc(e.nome || '')}" /></div>
      <div class="field"><label>CPF / CNPJ</label><input id="f-doc" value="${esc(e.documento || '')}" /></div>
      <div class="field"><label>Tipo</label><select id="f-tipo">
        ${opt('comprador', 'Comprador', e.tipo)}${opt('vendedor', 'Vendedor', e.tipo)}${opt('ambos', 'Comprador e vendedor', e.tipo)}
      </select></div>
      <div class="field"><label>Telefone</label><input id="f-tel" value="${esc(e.telefone || '')}" /></div>
      <div class="field"><label>E-mail</label><input id="f-email" value="${esc(e.email || '')}" /></div>
      <div class="field full"><label>Endereço</label><input id="f-end" value="${esc(e.endereco || '')}" /></div>
      <div class="field full"><label>Observações</label><textarea id="f-obs">${esc(e.observacoes || '')}</textarea></div>
    </div>
    <div class="modal-actions">
      <button class="ghost" data-close>Cancelar</button>
      <button class="btn" id="salvar">Salvar</button>
    </div>`);
  wireClose();
  $('#salvar').addEventListener('click', async () => {
    const nome = val('f-nome');
    if (!nome) return toast('Informe o nome.');
    const obj = {
      id: e.id || uid(),
      nome,
      documento: val('f-doc'),
      tipo: val('f-tipo') || 'comprador',
      telefone: val('f-tel'),
      email: val('f-email'),
      endereco: val('f-end'),
      observacoes: val('f-obs'),
    };
    if (e.id) {
      Object.assign(getCliente(e.id), obj);
    } else {
      state.clientes.push(obj);
    }
    await persist();
    closeModal();
    render();
    toast('Cadastro salvo.');
  });
}

// ---- Modal Lance ----
function modalLance() {
  const l = getLeilao(activeLeilaoId);
  if (!l) return toast('Selecione um leilão.');
  const lotes = lotesDoLeilao(l.id).sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));
  if (!lotes.length) return toast('Cadastre lotes antes de registrar lances.');
  const clientes = state.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  openModal(`
    <h3>Registrar lance</h3>
    <div class="form-grid">
      <div class="field full"><label>Lote *</label><select id="f-lote">
        ${lotes.map((lo) => `<option value="${lo.id}">Nº ${esc(lo.numero)} — ${esc(lo.titulo)}</option>`).join('')}
      </select></div>
      <div class="field full"><label>Arrematante *</label><select id="f-cli">
        <option value="">— selecione —</option>
        ${clientes.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}
      </select></div>
      <div class="field"><label>Valor do lance (R$) *</label><input id="f-valor" placeholder="0,00" /></div>
    </div>
    <p class="hint">Dica: use "Apurar vencedor" na aba Lances para transformar o maior lance em arremate.</p>
    <div class="modal-actions">
      <button class="ghost" data-close>Cancelar</button>
      <button class="btn" id="salvar">Registrar</button>
    </div>`);
  wireClose();
  $('#salvar').addEventListener('click', async () => {
    const loteId = val('f-lote');
    const arrematanteId = val('f-cli');
    const valor = numVal('f-valor');
    if (!arrematanteId) return toast('Selecione o arrematante.');
    if (valor <= 0) return toast('Informe um valor válido.');
    state.lances.push({
      id: uid(),
      loteId,
      arrematanteId,
      valor,
      dataHora: new Date().toISOString(),
    });
    await persist();
    closeModal();
    render();
    toast('Lance registrado.');
  });
}

function opt(value, label, selected) {
  return `<option value="${value}"${selected === value ? ' selected' : ''}>${esc(label)}</option>`;
}
function wireClose() {
  $$('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
}

// ======================================================================
// Ações de exclusão / apuração
// ======================================================================
async function excluirLeilao(id) {
  const l = getLeilao(id);
  if (!l) return;
  const nLotes = lotesDoLeilao(id).length;
  if (!confirm(`Excluir o leilão "${l.nome}"${nLotes ? ` e seus ${nLotes} lote(s)` : ''}? Esta ação não pode ser desfeita.`)) return;
  const loteIds = new Set(lotesDoLeilao(id).map((x) => x.id));
  state.lotes = state.lotes.filter((x) => x.leilaoId !== id);
  state.lances = state.lances.filter((x) => !loteIds.has(x.loteId));
  state.leiloes = state.leiloes.filter((x) => x.id !== id);
  if (activeLeilaoId === id) activeLeilaoId = state.leiloes[0] ? state.leiloes[0].id : null;
  await persist();
  render();
  toast('Leilão excluído.');
}

async function excluirLote(id) {
  const lo = state.lotes.find((x) => x.id === id);
  if (!lo) return;
  if (!confirm(`Excluir o lote "${lo.titulo}" e seus lances?`)) return;
  state.lotes = state.lotes.filter((x) => x.id !== id);
  state.lances = state.lances.filter((x) => x.loteId !== id);
  await persist();
  render();
  toast('Lote excluído.');
}

async function excluirCliente(id) {
  const c = getCliente(id);
  if (!c) return;
  const usado = state.lotes.some((x) => x.arrematanteId === id) || state.lances.some((x) => x.arrematanteId === id);
  const aviso = usado ? '\n\nAtenção: este cliente está vinculado a lotes/lances, que ficarão sem identificação.' : '';
  if (!confirm(`Excluir o cadastro de "${c.nome}"?${aviso}`)) return;
  state.clientes = state.clientes.filter((x) => x.id !== id);
  await persist();
  render();
  toast('Cadastro excluído.');
}

async function excluirLance(id) {
  if (!confirm('Excluir este lance?')) return;
  state.lances = state.lances.filter((x) => x.id !== id);
  await persist();
  render();
  toast('Lance excluído.');
}

async function apurarVencedor(lanceId) {
  const lance = state.lances.find((x) => x.id === lanceId);
  if (!lance) return;
  const lote = state.lotes.find((x) => x.id === lance.loteId);
  if (!lote) return toast('Lote não encontrado.');
  if (!confirm(`Marcar o lote "${lote.titulo}" como VENDIDO para ${clienteNome(lance.arrematanteId)} por ${fmtBRL(lance.valor)}?`)) return;
  lote.status = 'vendido';
  lote.valorArremate = lance.valor;
  lote.arrematanteId = lance.arrematanteId;
  await persist();
  render();
  toast('Arremate apurado.');
}

// ======================================================================
// Exportação CSV do financeiro
// ======================================================================
async function exportarCsv() {
  const l = getLeilao(activeLeilaoId);
  if (!l) return;
  const lotes = lotesDoLeilao(l.id);
  const vendidos = lotes.filter(Calc.loteVendido).sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));
  const sep = ';';
  const esc2 = (s) => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
  const money = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');

  const linhas = [];
  linhas.push(['Leilao', l.nome].map(esc2).join(sep));
  linhas.push(['Data', fmtDate(l.data)].map(esc2).join(sep));
  linhas.push([`Comissao comprador (%)`, l.comissaoCompradorPct, `Comissao vendedor (%)`, l.comissaoVendedorPct].map(esc2).join(sep));
  linhas.push('');
  linhas.push(['Numero', 'Lote', 'Arrematante', 'Martelo', 'Com. Comprador', 'Total Comprador', 'Com. Vendedor', 'Repasse Vendedor'].map(esc2).join(sep));
  for (const lo of vendidos) {
    const f = Calc.financeiroLote(lo, l);
    linhas.push([lo.numero, lo.titulo, clienteNome(lo.arrematanteId), money(f.martelo), money(f.comissaoComprador),
      money(f.totalComprador), money(f.comissaoVendedor), money(f.repasseVendedor)].map(esc2).join(sep));
  }
  const resumo = Calc.resumoLeilao(l, lotes);
  linhas.push('');
  linhas.push(['TOTAIS', '', '', money(resumo.martelo), money(resumo.comissaoComprador),
    money(resumo.totalComprador), money(resumo.comissaoVendedor), money(resumo.repasseVendedor)].map(esc2).join(sep));
  linhas.push(['Receita do leiloeiro', money(resumo.receitaLeiloeiro)].map(esc2).join(sep));

  const nome = `financeiro-${l.nome.replace(/[^\w]+/g, '-').toLowerCase()}.csv`;
  const r = await window.api.exportCsv({ nome, conteudo: linhas.join('\r\n') });
  if (r && r.ok) toast('CSV exportado.');
}

// ======================================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

boot();
