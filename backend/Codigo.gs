// ============================================================================
// HOSPITAL PIO XII • GOVERNANÇA E HIGIENIZAÇÃO (BACKEND GOOGLE APPS SCRIPT)
// ============================================================================

function doGet(e) {
  const page = e && e.parameter && e.parameter.page ? String(e.parameter.page) : '';

  if (page === 'portal') {
    const tpl = HtmlService.createTemplateFromFile('portal');
    tpl.webAppUrl = ScriptApp.getService().getUrl();
    return tpl.evaluate()
      .setTitle('Portal Governança • Hospital Pio XII')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (page === 'dashboard') {
    return HtmlService.createHtmlOutputFromFile('dashboard')
      .setTitle('Dashboard Executivo • Hospital Pio XII')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (page === 'pdca') {
    const tpl = HtmlService.createTemplateFromFile('pdca');
    tpl.prefill = JSON.stringify(e.parameter || {});
    return tpl.evaluate()
      .setTitle('Planos de Ação Corretiva • PDCA • Hospital Pio XII')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (page === 'tv') {
    return HtmlService.createHtmlOutputFromFile('tv')
      .setTitle('Gestão à Vista TV • Hospital Pio XII')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Checklist Higienização • Hospital Pio XII')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function obterOuCriarAba_(nomeAba, cabecalhos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    sheet = ss.insertSheet(nomeAba);
    if (cabecalhos && cabecalhos.length > 0) {
      sheet.appendRow(cabecalhos);
      sheet.getRange(1, 1, 1, cabecalhos.length)
        .setBackground('#9A2B2E')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function registrarChecklist(dados) {
  const sheet = obterOuCriarAba_('Historico_Checklist', [
    'ID', 'DataHora', 'Auditora', 'Setor', 'Leito', 'TipoLimpeza', 'TotalItens', 'NaoConformes', 'ItensFalhaStr'
  ]);
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');
  const id = 'CHK-' + Utilities.formatDate(new Date(), tz, 'ddHHmmss');
  const itensFalhaStr = (dados.falhas || []).map(f => `${f.nome} (${f.ambiente})`).join(' | ');

  sheet.appendRow([
    id, agora, dados.auditora || 'Auditora', dados.setor || 'Geral', dados.leito || '-',
    dados.tipoLimpeza || 'Concorrente', dados.totalItens || 32, (dados.falhas || []).length, itensFalhaStr || 'Nenhuma'
  ]);
  return { sucesso: true, id: id };
}

function obterDadosDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Historico_Checklist');
  if (!sheet || sheet.getLastRow() < 2) {
    return { taxaConformidade: 100, totalInspecoes: 0, taxaTerminal: 100, taxaConcorrente: 100, historico: [], itensDetalhados: [] };
  }

  const dados = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getDisplayValues();
  let totalInspecoes = 0, totalItensGeral = 0, totalFalhasGeral = 0;
  let totalTerminais = 0, falhasTerminais = 0, totalConcorrentes = 0, falhasConcorrentes = 0;
  const contagemFalhasItens = {};

  const historico = dados.filter(r => r[0]).map(r => {
    totalInspecoes++;
    const tItens = Number(r[6]) || 32;
    const nConf = Number(r[7]) || 0;
    totalItensGeral += tItens;
    totalFalhasGeral += nConf;

    const tipo = r[5] || 'Concorrente';
    if (tipo.indexOf('Terminal') !== -1) {
      totalTerminais++;
      if (nConf > 0) falhasTerminais++;
    } else {
      totalConcorrentes++;
      if (nConf > 0) falhasConcorrentes++;
    }

    const falhasStr = r[8] || '';
    if (falhasStr && falhasStr !== 'Nenhuma') {
      falhasStr.split(' | ').forEach(fItem => {
        const nomeLimpo = fItem.split('(')[0].trim();
        contagemFalhasItens[nomeLimpo] = (contagemFalhasItens[nomeLimpo] || 0) + 1;
      });
    }

    return {
      id: r[0], dataHora: r[1], data: (r[1] || '').split(' ')[0],
      auditora: r[2], setor: r[3], leito: r[4], tipo: tipo,
      totalItens: tItens, naoConformes: nConf, falhas: falhasStr
    };
  }).reverse();

  const taxaConformidade = totalItensGeral > 0 ? Math.max(0, ((totalItensGeral - totalFalhasGeral) / totalItensGeral) * 100) : 100;
  const taxaTerminal = totalTerminais > 0 ? Math.max(0, ((totalTerminais - falhasTerminais) / totalTerminais) * 100) : 100;
  const taxaConcorrente = totalConcorrentes > 0 ? Math.max(0, ((totalConcorrentes - falhasConcorrentes) / totalConcorrentes) * 100) : 100;

  const ITENS_PADRAO_CHECKLIST = [
    'Teto', 'Parede', 'Régua de Gases', 'Cama', 'Campainha', 'Escada beira leito',
    'Suporte de soro', 'Mesa de refeição', 'Mesa de cabeceira', 'Poltrona / Sofá',
    'Televisão', 'Controle TV/Ar', 'Janelas / Telas', 'Persiana janela', 'Pia do quarto',
    'Lixeiras', 'Cortina divisória', 'Frigobar', 'Armários', 'Mesa / Cadeira',
    'Dispenser', 'Quadro', 'Interruptor quarto', 'Portas', 'Maçaneta quarto',
    'Maçaneta banheiro', 'Interruptor banheiro', 'Pia do banheiro', 'Vaso sanitário',
    'Ducha higiênica', 'Barra de apoio', 'Ralo'
  ];

  const itensDetalhados = ITENS_PADRAO_CHECKLIST.map(nome => ({
    nome: nome,
    ambiente: nome.indexOf('banheiro') !== -1 || nome === 'Vaso sanitário' || nome === 'Ralo' || nome === 'Ducha higiênica' || nome === 'Barra de apoio' ? 'Banheiro' : 'Quarto',
    nconf: contagemFalhasItens[nome] || 0
  }));

  return { taxaConformidade, totalInspecoes, taxaTerminal, taxaConcorrente, historico, itensDetalhados };
}

function obterDadosPDCA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetPlanos = ss.getSheetByName('Planos_Acao_PDCA') || obterOuCriarAba_('Planos_Acao_PDCA', ['Protocolo', 'DataHora', 'ItemAlvo', 'DescricaoAcao', 'Responsavel', 'PrazoOuObs', 'Status', 'DetalhesConclusao']);
  let sheetPlantao = ss.getSheetByName('Fechamentos_Plantao') || obterOuCriarAba_('Fechamentos_Plantao', ['Protocolo', 'DataHora', 'Turno', 'Responsavel', 'ResumoIndicadores', 'Observacoes']);

  const dadosPlanos = sheetPlanos.getLastRow() > 1 ? sheetPlanos.getRange(2, 1, sheetPlanos.getLastRow() - 1, 8).getDisplayValues() : [];
  const planosAcao = dadosPlanos.filter(r => r[0]).map(r => ({
    protocolo: r[0], dataHora: r[1], alvo: r[2], descricao: r[3],
    responsavel: r[4], prazoOuObs: r[5], status: r[6] || 'Ativo', detalhesConclusao: r[7] || ''
  })).reverse();

  const dadosPlantao = sheetPlantao.getLastRow() > 1 ? sheetPlantao.getRange(2, 1, sheetPlantao.getLastRow() - 1, 6).getDisplayValues() : [];
  const fechamentosTurno = dadosPlantao.filter(r => r[0]).map(r => ({
    protocolo: r[0], dataHora: r[1], alvo: r[2], responsavel: r[3], descricao: r[4], prazoOuObs: r[5]
  })).reverse();

  return { planosAcao, fechamentosTurno };
}

function registrarPlanoAcaoPDCA(dados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Planos_Acao_PDCA') || obterOuCriarAba_('Planos_Acao_PDCA', ['Protocolo', 'DataHora', 'ItemAlvo', 'DescricaoAcao', 'Responsavel', 'PrazoOuObs', 'Status', 'DetalhesConclusao']);
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');
  const proto = 'PDCA-' + Utilities.formatDate(new Date(), tz, 'ddHHmmss');

  const novaLinha = [proto, agora, dados.itemAlvo || 'Geral', dados.acaoCorretiva || '-', dados.responsavel || 'Equipe', dados.prazo || 'Imediato', 'Ativo', ''];
  sheet.appendRow(novaLinha);
  return { sucesso: true, item: { protocolo: proto, dataHora: agora, alvo: novaLinha[2], descricao: novaLinha[3], responsavel: novaLinha[4], prazoOuObs: novaLinha[5], status: 'Ativo', detalhesConclusao: '' } };
}

function editarPlanoAcaoPDCA(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Planos_Acao_PDCA');
  if (!sheet || sheet.getLastRow() < 2) return { sucesso: false };
  const protos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let i = 0; i < protos.length; i++) {
    if (protos[i][0] === dados.protocolo) {
      const rowNum = i + 2;
      sheet.getRange(rowNum, 3).setValue(dados.itemAlvo);
      sheet.getRange(rowNum, 4).setValue(dados.acaoCorretiva);
      sheet.getRange(rowNum, 5).setValue(dados.responsavel);
      sheet.getRange(rowNum, 6).setValue(dados.prazo);
      return { sucesso: true, item: { protocolo: dados.protocolo, dataHora: sheet.getRange(rowNum, 2).getDisplayValue(), alvo: dados.itemAlvo, descricao: dados.acaoCorretiva, responsavel: dados.responsavel, prazoOuObs: dados.prazo, status: sheet.getRange(rowNum, 7).getDisplayValue() || 'Ativo', detalhesConclusao: sheet.getRange(rowNum, 8).getDisplayValue() } };
    }
  }
  return { sucesso: false };
}

function atualizarStatusPlanoPDCA(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Planos_Acao_PDCA');
  if (!sheet || sheet.getLastRow() < 2) return { sucesso: false };
  const protos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');

  for (let i = 0; i < protos.length; i++) {
    if (protos[i][0] === dados.protocolo) {
      const rowNum = i + 2;
      const novoStatus = dados.novoStatus || 'Concluido';
      let detalhes = novoStatus === 'Concluido' ? `Concluído por ${dados.responsavel || 'Líder'} em ${agora}${dados.evidencia ? ' | Evidência: ' + dados.evidencia : ''}` : `Reaberto em ${agora}`;
      sheet.getRange(rowNum, 7).setValue(novoStatus);
      sheet.getRange(rowNum, 8).setValue(detalhes);
      return { sucesso: true, status: novoStatus, detalhesConclusao: detalhes };
    }
  }
  return { sucesso: false };
}

function excluirRegistroPDCA(protocolo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Planos_Acao_PDCA', 'Fechamentos_Plantao'].forEach(nomeAba => {
    const sheet = ss.getSheetByName(nomeAba);
    if (sheet && sheet.getLastRow() >= 2) {
      const protos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
      for (let i = 0; i < protos.length; i++) {
        if (protos[i][0] === protocolo) { sheet.deleteRow(i + 2); return { sucesso: true }; }
      }
    }
  });
  return { sucesso: false };
}

function encerrarPlantaoTurno(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Fechamentos_Plantao') || obterOuCriarAba_('Fechamentos_Plantao', ['Protocolo', 'DataHora', 'Turno', 'Responsavel', 'ResumoIndicadores', 'Observacoes']);
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');
  const proto = 'PLT-' + Utilities.formatDate(new Date(), tz, 'ddHHmmss');
  const novaLinha = [proto, agora, dados.turno || 'Plantão', dados.responsavel || 'Líder', dados.resumoIndicadores || '-', dados.observacoes || '-'];
  sheet.appendRow(novaLinha);
  return { sucesso: true, fechamento: { protocolo: proto, dataHora: agora, alvo: novaLinha[2], responsavel: novaLinha[3], descricao: novaLinha[4], prazoOuObs: novaLinha[5] } };
}

function obterOuCriarAbaCronograma_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Cronograma_Semanal');
  if (!sheet) {
    sheet = ss.insertSheet('Cronograma_Semanal');
    sheet.appendRow(['ID', 'DataHora_Cadastro', 'Dia_Semana', 'Setor', 'Ambiente_Leito', 'Atividade', 'Responsavel', 'Observacoes', 'Status', 'Conclusao_Info']);
    sheet.getRange(1, 1, 1, 10).setBackground('#9A2B2E').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function obterCronogramaSemanal() {
  const sheet = obterOuCriarAbaCronograma_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 10).getDisplayValues().filter(r => r[0]).map(r => ({
    id: r[0], dataHoraCadastro: r[1], diaSemana: r[2], setor: r[3], ambiente: r[4],
    atividade: r[5], responsavel: r[6], observacoes: r[7], status: r[8] || 'Pendente', conclusaoInfo: r[9] || ''
  })).reverse();
}

function registrarCronogramaSemanal(dados) {
  const sheet = obterOuCriarAbaCronograma_();
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');
  const id = 'CRN-' + Utilities.formatDate(new Date(), tz, 'ddHHmmss');
  const novaLinha = [id, agora, dados.diaSemana || 'Segunda-feira', dados.setor || 'Geral', dados.ambiente || 'Todos os leitos', dados.atividade || 'Limpeza programada', dados.responsavel || 'Equipe', dados.observacoes || '-', 'Pendente', ''];
  sheet.appendRow(novaLinha);
  return { sucesso: true, item: { id, dataHoraCadastro: agora, diaSemana: novaLinha[2], setor: novaLinha[3], ambiente: novaLinha[4], atividade: novaLinha[5], responsavel: novaLinha[6], observacoes: novaLinha[7], status: 'Pendente', conclusaoInfo: '' } };
}

function alternarStatusCronogramaSemanal(id) {
  const sheet = obterOuCriarAbaCronograma_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { sucesso: false };
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      const rowNum = i + 2;
      const novoStatus = sheet.getRange(rowNum, 9).getDisplayValue() === 'Executado' ? 'Pendente' : 'Executado';
      const info = novoStatus === 'Executado' ? `Executado em ${agora}` : '';
      sheet.getRange(rowNum, 9).setValue(novoStatus);
      sheet.getRange(rowNum, 10).setValue(info);
      return { sucesso: true, status: novoStatus, conclusaoInfo: info };
    }
  }
  return { sucesso: false };
}

function excluirCronogramaSemanal(id) {
  const sheet = obterOuCriarAbaCronograma_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { sucesso: false };
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) { sheet.deleteRow(i + 2); return { sucesso: true }; }
  }
  return { sucesso: false };
}
