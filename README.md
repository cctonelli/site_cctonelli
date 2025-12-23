
# Claudio Tonelli Consultoria - Advisory Hub v6.5

Este é o ecossistema digital premium da **Claudio Tonelli Consultoria**, projetado para oferecer uma experiência imersiva de nível "McKinsey/BCG" para CEOs e gestores. O projeto evoluiu de uma SPA estática para uma plataforma dinâmica, resiliente e movida por Inteligência Artificial.

## 🚀 Retrospectiva do Projeto: Do Estático ao Elite

O projeto passou por três grandes fases de transformação:
1.  **v1.0 - v3.0 (Legacy):** Site em Angular com visual genérico e conteúdo fixo.
2.  **v4.0 - v5.5 (Transição):** Migração para React 19 + Vite. Implementação inicial do Supabase e Admin Dashboard.
3.  **v6.0 - v6.5 (Estado Atual):** Ativação do **Realtime Sync**, **Hero Carousel Dinâmico**, **IA Gemini Integrada** e **Persistência de Sessão Robusta**.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 (Esm.sh) + Tailwind CSS.
- **Backend/Database:** Supabase (PostgreSQL + Realtime).
- **Autenticação:** Supabase Auth com persistência em `localStorage`.
- **Inteligência Artificial:** Google Gemini API (Model: `gemini-3-flash-preview`).
- **Animações & 3D:** Framer Motion + Three.js (Globe Visualization).
- **Componentes UI:** Swiper (Carousel), Tiptap (Rich Text Editor).

---

## 🔐 Gestão de Sessões e Autenticação

A arquitetura de segurança utiliza o **Supabase Auth** para diferenciar acessos:

### Funções de Sessão
- **Persistence Logic:** A sessão é salva no `localStorage` e renovada automaticamente via `autoRefreshToken`, evitando logouts indesejados ao recarregar a página.
- **Role-Based Access (RBAC):**
    - **Admin (`user_type: 'admin'`):** Acesso total ao `AdminDashboard` para gestão de métricas, produtos e insights.
    - **Client (`user_type: 'client'`):** Acesso ao `ClientPortal` com recomendações personalizadas por IA.
- **Sincronização Global:** O estado `userProfile` no `App.tsx` reage instantaneamente a eventos de login/logout através do listener `onAuthStateChange`.

---

## 📊 Integração de Dados (Supabase)

O site é 100% orientado a dados. Abaixo, o mapeamento das sessões:

| Tabela | Função no Site | Local de Exibição |
| :--- | :--- | :--- |
| `carousel_images` | Imagens de fundo e textos de impacto. | Hero Section (Topo) |
| `metrics` | KPIs quantitativos (Ex: +25 anos). | Seção de Performance |
| `insights` | Artigos técnicos e notícias. | Knowledge Hub / Article Page |
| `products` | Mentorias, cursos e serviços. | Store / Client Portal |
| `site_content` | Textos globais, badges e labels. | Global (via `resolveContent`) |
| `profiles` | Dados de usuários e permissões. | Navegação e Portais |
| `contacts` | Leads capturados no formulário. | Admin (Leads CRM) |

---

## 🧠 Inteligência Artificial (Advisory Core)

Utilizamos o SDK `@google/genai` para duas funções críticas:
1.  **ChatBot Estratégico:** Consultoria em tempo real baseada em instruções sistêmicas de alto nível.
2.  **Personalized Recommendations:** No Portal do Cliente, a IA analisa o perfil do usuário e sugere o produto/serviço mais adequado do catálogo.

---

## 📐 Estrutura de Seções da Home

1.  **Hero Dinâmico:** Se houver slides ativos em `carousel_images`, exibe o carrossel com efeito *Glassmorphism*. Fallback: `ThreeGlobe`.
2.  **Performance Metrics:** Grid de 4 colunas exibindo o impacto da consultoria.
3.  **Knowledge Hub:** Vitrine de Insights filtrados por `is_active`.
4.  **Solution Store:** Sessão de produtos com integração de link externo para pagamento/contratação.
5.  **Social Proof:** Depoimentos aprovados pelo administrador.
6.  **Direct Connection:** Formulário de captura de leads.

---

## 📈 Versionamento e Roadmap

- **v6.0:** Correção de Deadlocks no Admin e Mounted Guards nos Effects.
- **v6.2:** Ativação do Hero Carousel via Swiper.
- **v6.5 (Current):** Sincronização em tempo real (Realtime) em todas as tabelas públicas.
- **Próximos Passos (v7.0):** Implementação completa do Seletor de Idiomas (EN/ES) em todas as seções via `content_translations`.

---

**Administrador Responsável:** Claudio Tonelli  
**Desenvolvimento:** Senior Frontend Advisory Engine  
**Status:** Produção / Estável
