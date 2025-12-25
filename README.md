
# Claudio Tonelli Consultoria — Advisory Hub v6.6

O site institucional da **Claudio Tonelli Consultoria** é uma plataforma digital de alto padrão (estilo McKinsey/BCG), desenvolvida para CEOs e gestores que buscam estratégia de elite, transformação digital e excelência operacional. 

Este ecossistema é 100% dinâmico, movido por dados em tempo real e inteligência artificial, oferecendo total autonomia ao administrador através de um CMS (Content Management System) proprietário.

**Link do Projeto:** [Vercel Deployment](https://site-cctonelli.vercel.app)

---

## 🚀 Retrospectiva: A Evolução para a Excelência

O projeto passou por uma transformação radical para atingir o estado de maturidade atual:

1.  **Fase 1 (Legacy):** Site estático em Angular com design genérico e conteúdo hard-coded.
2.  **Fase 2 (Transição):** Migração para **React 19 + Vite**, adoção do **Tailwind CSS** e integração inicial com **Supabase**.
3.  **Fase 3 (v6.6 - Atual):** Implementação de **Realtime Sync**, **Hero Carousel Dinâmico**, Persistência de Sessão e **Advisory Core via Gemini 3 Pro**.

---

## 🛠️ Stack Tecnológica de Ponta

*   **Frontend:** React 19 + Vite (performance extrema e renderização ultra-rápida).
*   **Backend & Realtime:** Supabase (PostgreSQL) com escuta ativa para atualizações instantâneas.
*   **IA Generativa:** Google Gemini API (`gemini-3-pro-preview`) para insights e recomendações de alto nível.
*   **Animações & 3D:** Three.js (Globo Interativo) + Framer Motion.
*   **UI Components:** Swiper.js (Carousel Premium) + Tiptap (Editor de Texto Rico).

---

## ⚠️ Solução de Problemas Comuns (Troubleshooting)

### Erro de Cache de Schema (PGRST205)
Se encontrar o erro `Could not find the table 'public.table_name' in the schema cache`, certifique-se de que:
1.  **Nomes de Tabela no Frontend:** O código utiliza `supabase.from('table_name')` **sem** o prefixo `public.`. Adicionar o prefixo causa duplicação no resolve do schema cache.
2.  **Reset de Cache:** Execute o comando `NOTIFY pgrst, 'reload schema';` no SQL Editor do Supabase após criar novas tabelas ou se os fetches falharem.
3.  **Contexto de Erro:** O sistema de logs do site agora identifica o nome da tabela no console e sugere o SQL correto para restaurar a funcionalidade.

---

## 🔐 Gestão de Sessões e Segurança

A plataforma utiliza o **Supabase Auth** com uma camada de persistência robusta:
*   **Persistência:** Sessão mantida via `localStorage` com `autoRefreshToken`, garantindo que o executivo permaneça logado entre navegações.
*   **RBAC (Role-Based Access Control):** Diferenciação clara entre áreas administrativas e portais de cliente.

---

**Claudio Tonelli Consultoria**  
*Arquitetando o amanhã através de rigor metodológico e inovação digital.*
