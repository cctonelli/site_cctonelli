# Claudio Tonelli Consultoria — Advisory Hub v6.5

O site institucional da **Claudio Tonelli Consultoria** é uma plataforma digital de alto padrão (estilo McKinsey/BCG), desenvolvida para CEOs e gestores que buscam estratégia de elite, transformação digital e excelência operacional. 

Este ecossistema é 100% dinâmico, movido por dados em tempo real e inteligência artificial, oferecendo total autonomia ao administrador através de um CMS (Content Management System) proprietário.

**Link do Projeto:** [Vercel Deployment](https://site-cctonelli.vercel.app)

---

## 🚀 Retrospectiva: A Evolução para a Excelência

O projeto passou por uma transformação radical para atingir o estado de maturidade atual:

1.  **Fase 1 (Legacy):** Site estático em Angular com design genérico e conteúdo hard-coded.
2.  **Fase 2 (Transição):** Migração para **React 19 + Vite**, adoção do **Tailwind CSS** e integração inicial com **Supabase**.
3.  **Fase 3 (v6.5 - Atual):** Implementação de **Realtime Sync**, **Hero Carousel Dinâmico**, Persistência de Sessão e **Advisory Core via IA Gemini**.

---

## 🛠️ Stack Tecnológica de Ponta

*   **Frontend:** React 19 + Vite (performance extrema e renderização ultra-rápida).
*   **Backend & Realtime:** Supabase (PostgreSQL) com escuta ativa para atualizações instantâneas.
*   **IA Generativa:** Google Gemini API (`gemini-3-flash-preview`) para insights e recomendações.
*   **Animações & 3D:** Three.js (Globo Interativo) + Framer Motion.
*   **UI Components:** Swiper.js (Carousel Premium) + Tiptap (Editor de Texto Rico).

---

## 🔐 Gestão de Sessões e Segurança

A plataforma utiliza o **Supabase Auth** com uma camada de persistência robusta:
*   **Persistência:** Sessão mantida via `localStorage` com `autoRefreshToken`, garantindo que o executivo permaneça logado entre navegações.
*   **RBAC (Role-Based Access Control):** 
    *   **Admin:** Acesso ao Dashboard de Gestão Total.
    *   **Client:** Acesso ao Portal do Cliente com recomendações personalizadas por IA.
*   **RLS (Row Level Security):** Políticas de segurança a nível de banco de dados para proteção de dados sensíveis.

---

## 📊 Integração de Dados (Data-Driven CMS)

O site pulsa de acordo com o banco de dados. Cada seção da Home é mapeada diretamente no Supabase:

| Seção | Tabela Supabase | Funcionalidade |
| :--- | :--- | :--- |
| **Hero** | `carousel_images` | Slides dinâmicos com títulos e imagens de alta resolução. |
| **KPIs** | `metrics` | Números de impacto (Projetos, Experiência, LinkedIn). |
| **Knowledge** | `insights` | Artigos técnicos com suporte a HTML rico. |
| **Solutions** | `products` | Loja de serviços, mentorias e produtos digitais. |
| **Social Proof** | `testimonials` | Depoimentos de clientes aprovados pelo admin. |
| **Copywriting** | `site_content` | Gestão de textos globais (menus, botões, headers). |

---

## 🧠 Inteligência Artificial (Advisory Core)

Integramos o SDK `@google/genai` para oferecer:
1.  **Consultor Virtual:** Um chat estratégico que utiliza as instruções sistêmicas da Claudio Tonelli para responder dúvidas executivas.
2.  **Smart Recommendations:** No Portal do Cliente, a IA analisa o perfil do usuário e sugere o serviço/produto do catálogo que melhor se adapta às suas necessidades de ROI.

---

## 📐 Estrutura de Navegação (Funil de Autoridade)

1.  **Hero Carousel:** Impacto visual imediato com Glassmorphism.
2.  **Metrics Bar:** Validação imediata de autoridade através de números.
3.  **Insights Hub:** Prova de conceito e autoridade intelectual.
4.  **Soluções:** Catálogo direto para contratação e aquisição.
5.  **Formulário Estratégico:** Captura de leads qualificados integrada ao CRM.

---

## 📈 Versionamento e Roadmap

*   **v6.0:** Estabilidade de conexões e tratamento de concorrência no Admin.
*   **v6.2:** Ativação do Carrossel dinâmico e suporte a Realtime.
*   **v6.5 (Atual):** Refinamento estético, persistência de sessão e integração Gemini v3.
*   **v7.0 (Próximo):** Internacionalização (i18n) completa para Inglês e Espanhol em todas as tabelas.

---

**Claudio Tonelli Consultoria**  
*Arquitetando o amanhã através de rigor metodológico e inovação digital.*