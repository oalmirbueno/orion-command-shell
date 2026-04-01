# Orion Mission Control

Painel de comando operacional para o ecossistema Orion/OpenClaw.  
Stack: React 18 · Vite 5 · TypeScript · Tailwind CSS · shadcn/ui · React Query · Recharts

**Produção:** `orion.aceleriq.online`  
**Repo:** `oalmirbueno/orion-command-shell`

---

## Arquitetura

```
src/
├── domains/          # Camada de dados — fetchers real-first + fallback
├── hooks/            # useOrionData, useOrionStream (SSE), useDomainHealth
├── components/       # UI por domínio + primitivas Orion
├── pages/            # Rotas do painel
└── lib/              # Utilitários
```

**Padrão de dados:** `createRealFirstFetcher` — tenta API real primeiro, fallback honesto em caso de falha.  
**Estado global:** React Query + SSE stream (`useOrionStream`) + `DomainHealthStore` (saúde por domínio).

---

## Módulos — Status Real

### ✅ Concluídos

| Módulo | Rota | Domínio | Descrição |
|--------|------|---------|-----------|
| **Comando (Home)** | `/` | `home` | Dashboard executivo clicável — métricas, atenção, operações, agentes, saúde, briefing, weather, skills, builders |
| **Agentes** | `/agents` | `agents` | Lista + Centro de Controle Operacional (abas: Visão Geral, Configuração, Operação, Logs). Restart e toggle de estado |
| **Sessões** | `/sessions` | `sessions` | Sessões ativas com status derivado, tokens, progresso |
| **Operações** | `/operations` | `operations` | Kanban + timeline + seções por status |
| **Atividade** | `/activity` | `activity` | Feed de atividades + resumo |
| **Memória** | `/memory` | `memory` | Snapshots de memória + busca |
| **Alertas** | `/alerts` | `alerts` | Lista de alertas com severidade + resumo |
| **Cron** | `/cron` | `cron` | Jobs cron com status de saúde |
| **Sistema** | `/system` | `system` | Infra health — CPU/RAM/disco, uptime, serviços, cron health, sinais de estabilidade |
| **Arquivos** | `/files` | `files` | Navegador de arquivos |
| **Skills** | `/skills` | — | Catálogo de skills com detalhes expandidos (último uso, duração, arquivos) |
| **Builders** | `/builders` | — | Central de execução — OpenClaw / Claude Code / AIOX. Squads reais, tokens por domínio, tarefa atual |
| **Missões** | `/missions` | — | Dashboard operacional de workflows. Integração com cron via `cronMatch`. Visualização de fluxo + "Run Now" |
| **Timeline** | `/timeline` | `timeline` | Linha do tempo unificada — operations, alerts, cron, sessions, builders. Visual imersivo com linha central |
| **Lembretes** | `/reminders` | `reminders` | Lembretes + notícias derivados de alertas, cron, operações, sessões, atividade |
| **Busca** | `/search` | — | Busca global |
| **Notificações** | TopBar | — | Centro de notificações derivado do cache React Query. Deep-links para módulos de origem |

### 🔧 Funcionais (placeholder ou parciais)

| Módulo | Rota | Status |
|--------|------|--------|
| **Pipelines** | `/pipelines` | Placeholder — "Em desenvolvimento" |
| **Office 3D** | `/office3d` | Visualização 3D (Three.js) — funcional mas experimental |
| **Configurações** | `/settings` | Placeholder — "Em desenvolvimento" |

---

## Infraestrutura Transversal

| Componente | Status | Descrição |
|------------|--------|-----------|
| `OrionLayout` | ✅ | Sidebar + TopBar + StatusBar |
| `OrionDataWrapper` | ✅ | Loading/error/empty states padronizados |
| `DomainHealthStore` | ✅ | Saúde por domínio (live/stale/loading/offline) |
| `useOrionStream` (SSE) | ✅ | Stream real-time para cache React Query |
| `createRealFirstFetcher` | ✅ | Padrão real-first + fallback |
| `PageTransition` | ✅ | Transições animadas entre rotas |
| Skeletons por domínio | ✅ | Loading states específicos |
| Sheets de detalhe | ✅ | Painéis laterais para agents, operations, sessions, cron, files, memory, activity, workflows |
| Dashboard clicável | ✅ | Métricas e cards com deep-links internos |
| Notificações funcionais | ✅ | Derivadas do cache, com badge e navegação |

---

## Fontes de Dados Reais

| Endpoint | Consumido por |
|----------|---------------|
| `/api/agents` | Agents, Builders, Home |
| `/api/sessions` | Sessions, Builders, Timeline |
| `/api/cron` | Cron, Missions, Timeline, Reminders |
| `/api/alerts` | Alerts, Timeline, Reminders, Notificações |
| `/api/operations` | Operations, Timeline, Reminders |
| `/api/activity` | Activity, Reminders |
| `/api/system` | System, Home |
| `/api/memory` | Memory |
| `/api/files` | Files |
| `/api/builders/aiox-squads` | Builders (AIOX) |
| `/api/home` | Home (agregado) |

---

## Lacunas Reais / Próximo Ciclo

- [ ] **Pipelines** — módulo completo (ainda placeholder)
- [ ] **Configurações** — módulo completo (ainda placeholder)
- [ ] **Office 3D** — refinar para uso operacional real
- [ ] **Persistência de notificações** — marcar como lida (hoje é derivado em memória)
- [ ] **Filtros avançados** — em lembretes, timeline e atividade
- [ ] **Autenticação** — sem camada de auth no frontend
- [ ] **Testes** — cobertura mínima (apenas example.test.ts)
- [ ] **PWA / offline** — sem suporte offline
- [ ] **i18n formal** — UI em português mas sem framework de internacionalização

---

*Última revisão: abril 2026*
