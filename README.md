# sistema-governanca-hospitalar-pio-xii
Ecossistema Multi-PWA Serverless para Governança, Auditoria de Leitos, PDCA 5W2H, Cronograma e Gestão à Vista Hospitalar (Google Apps Script + Sheets)
# 🏥 Sistema Integrado de Governança Hospitalar & Higienização (Pio XII)

![Status](https://img.shields.io/badge/Status-Em%20Produção-22C55E?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS%20%7C%20Google%20Apps%20Script-9A2B2E?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Google%20Sheets-15803D?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Multi--PWA%20Serverless-1D4ED8?style=for-the-badge)

Ecossistema web modular (**Progressive Web Apps**) desenvolvido para digitalizar, auditar e gerenciar de ponta a ponta os processos de **Governança, Hotelaria e Higienização Hospitalar**, com foco em conformidade **ONA (Organização Nacional de Acreditação)** e protocolos da **CCIH (Comissão de Controle de Infecção Hospitalar)**.

---

## 🎯 Problema Resolvido

Em ambientes hospitalares, auditorias de limpeza em papel geram atraso na identificação de não conformidades, perda de rastreabilidade na passagem de plantão e dificuldade na cobrança de planos corretivos. Este sistema substitui planilhas manuais e pranchetas por um **hub mobile-first em tempo real**, sem custo de infraestrutura de servidor.

---

## 🧩 Arquitetura e Módulos (Multi-PWA)

O projeto foi desenhado em módulos independentes servidos via **Google Apps Script (`HtmlService`)** e persistidos diretamente em abas estruturadas no **Google Sheets**:

| Módulo | Arquivo | Descrição e Funcionalidades Principais |
| :--- | :--- | :--- |
| **🌐 Portal Central** | `portal.html` | Hub unificado de acesso rápido, navegação incorporada via iframe e **Gaveta Lateral de Falhas** com conversão direta de não conformidades em planos PDCA. |
| **📋 Checklist de Leitos** | `index.html` | Formulário mobile-first para auditoria de **32 itens críticos** (Quarto e Banheiro), diferenciando *Limpeza Terminal* e *Concorrente*, com registro automático de auditora, setor e leito. |
| **📊 Dashboard Executivo** | `dashboard.html` | Painel analítico com índice global de conformidade, comparativo por tipo de limpeza, ranking de itens ofensores e histórico filtrável de inspeções. |
| **🎯 PDCA, SLA & Rotinas** | `pdca.html` | Módulo completo de gestão dividido em 4 submódulos:<br>• **Planos 5W2H:** Tratativas com classificação de risco CCIH, causa raiz (Ishikawa) e alerta de reincidência.<br>• **SLA & Líderes:** Cálculo de pontualidade, Tempo Médio de Resolução (TMR) e taxa de evidências por supervisora.<br>• **Cronograma Semanal:** Planejador rotativo de limpezas profundas por dia da semana e setor.<br>• **Passagem de Plantão:** Formalização com protocolo único (`PLT-...`) entre turnos. |
| **📺 Gestão à Vista (TV)** | `tv.html` | Painel de alto contraste (Dark Mode) com carrossel automático (18s) e auto-sync silencioso (5 min) para exibição em monitores/TVs da sala de Governança. |
| **⚙️ Backend Serverless** | `Codigo.gs` | API interna em Google Apps Script responsável pelo roteamento (`?page=...`), criação automática de abas/cabeçalhos e operações CRUD na planilha. |

---

## 🗄️ Estrutura do Banco de Dados (Google Sheets)

O sistema cria e gerencia automaticamente 4 abas na planilha vinculada:

1. `Historico_Checklist` — Registro bruto de todas as auditorias realizadas (`CHK-...`).
2. `Planos_Acao_PDCA` — Controle de planos corretivos, prazos, status e evidências de validação (`PDCA-...`).
3. `Fechamentos_Plantao` — Histórico de passagem de turno entre lideranças (`PLT-...`).
4. `Cronograma_Semanal` — Agenda programada de higienização profunda por ala/dia (`CRN-...`).

---

## 🚀 Como Implantar (Deploy)

1. Crie uma nova planilha no **Google Sheets**.
2. Acesse **Extensões > Apps Script**.
3. Copie o conteúdo de `backend/Codigo.gs` para o arquivo principal do projeto.
4. Crie os arquivos HTML (`portal`, `index`, `dashboard`, `pdca`, `tv`) dentro do editor do Apps Script e cole seus respectivos códigos.
5. Clique em **Implantar > Nova implantação > App da Web**:
   - **Executar como:** *Eu (proprietário)*
   - **Quem pode acessar:** *Qualquer pessoa* (ou restrito à organização)
6. Utilize os parâmetros de URL para acessar cada PWA diretamente ou instalar na tela inicial do smartphone (*Adicionar à Tela de Início*):
   - **Checklist:** `URL_DO_WEBAPP`
   - **Portal Unificado:** `URL_DO_WEBAPP?page=portal`
   - **Dashboard:** `URL_DO_WEBAPP?page=dashboard`
   - **PDCA & Turno:** `URL_DO_WEBAPP?page=pdca`
   - **Modo TV:** `URL_DO_WEBAPP?page=tv`

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (Custom Properties, Grid/Flexbox, Print Media Queries), JavaScript (ES6+), SheetJS (`xlsx.full.min.js` para exportação nativa em Excel).
* **Backend & Persistência:** Google Apps Script (`google.script.run`, `HtmlService`, `SpreadsheetApp`).
* **Design System:** Interface responsiva *Mobile-First* com suporte a PWA (`apple-mobile-web-app-capable`), exportação de relatórios executivos em PDF e Excel.

---

<p align="center">
  • Criado por 𝕄𝕣𝕝•𝕄𝕒𝕣𝕢𝕦𝕖𝕤 •
</p>
