// ============================================================================
// HOSPITAL PIO XII • GOVERNANÇA E HIGIENIZAÇÃO (BACKEND GOOGLE APPS SCRIPT)
// ============================================================================

function doGet(e) {
  const page = e && e.parameter && e.parameter.page ? String(e.parameter.page) : '';

  if (page === 'portal') {
    const tpl = HtmlService.createTemplateFromFile('portal');
    tpl.webAppUrl = ScriptApp.getService().getUrl();
    return tpl.evaluate().setTitle('Portal Governança • Hospital Pio XII');
  }
  if (page === 'dashboard') {
    return HtmlService.createHtmlOutputFromFile('dashboard').setTitle('Dashboard Executivo • Hospital Pio XII');
  }
  if (page === 'pdca') {
    const tpl = HtmlService.createTemplateFromFile('pdca');
    tpl.prefill = JSON.stringify(e.parameter || {});
    return tpl.evaluate().setTitle('Planos de Ação • PDCA • Hospital Pio XII');
  }
  if (page === 'tv') {
    return HtmlService.createHtmlOutputFromFile('tv').setTitle('Gestão à Vista TV • Hospital Pio XII');
  }
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Checklist Higienização • Hospital Pio XII');
}
