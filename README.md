# Claudio Tonelli Consultoria — Advisory Hub v9.0-ELITE

Este repositório contém a plataforma global de elite da **Claudio Tonelli Consultoria**, operando agora no estágio **v9.0-ELITE**. O sistema foi transformado de um site institucional em uma infraestrutura completa de vendas digitais e entrega de ativos estratégicos.

## 📊 Status de Integração da Loja (Protocolo v9.0)

A integração está em estágio **Operacional de Elite (100%)**. O fluxo completo revisado foi implementado e testado:

| Etapa | Status | Descrição Técnica |
| :--- | :--- | :--- |
| **Vitrine (/loja)** | ✅ OK | Grid premium consumindo `products` (is_active=true) via RLS `public_read`. |
| **Canvas (/loja/:slug)** | ✅ OK | Renderização dinâmica de `product_content_blocks` (Hero, Video, FAQ, Planos). |
| **Checkout PIX** | ✅ OK | Geração de payload PIX estático, QR Code e `INSERT` em `orders`. |
| **Auth Integration** | ✅ OK | Redirecionamento inteligente para login/cadastro mantendo o `variant_id`. |
| **Aprovação Admin** | ✅ OK | Aba de Pedidos no Dashboard permitindo `UPDATE` em `orders` e `INSERT` em `user_products`. |
| **Executive Hub** | ✅ OK | Portal de ativos com **Supabase Realtime** para liberação instantânea de downloads. |

---

## 🔐 Auditoria de Políticas RLS (Supabase)

O código atual foi auditado e está em conformidade total com as políticas de segurança (Row Level Security) definidas no banco de dados:

*   **Tabelas de Conteúdo (`carousel`, `insights`, `metrics`, `tools`):** Protegidas por `admin_full_access`. A leitura é pública (`public_read`), garantindo SEO e acessibilidade.
*   **Pedidos (`orders`):** Integrado com `user_read_own_orders` (via `auth.uid() = user_id`). O componente `CheckoutPage` realiza o insert respeitando o RBAC.
*   **Acesso a Ativos (`user_products`):** Conformidade total com `user_read_own_access`. O `ClientPortal` (Executive Hub) filtra apenas os ativos do usuário logado.
*   **Perfis (`profiles`):** Uso rigoroso de `auth.uid() = id` para garantir que parceiros e clientes acessem apenas seus próprios dados sensíveis.

---

## 🛠️ Tecnologias de Elite Empregadas

*   **AI Advisory:** Integração nativa com **Gemini 3 Pro** para recomendações personalizadas no Hub.
*   **Visualização 3D:** Globo de conexões globais em **Three.js** com performance otimizada.
*   **Infraestrutura:** Supabase (Auth, DB, Realtime, Storage) + Vercel (Edge Runtime).
*   **Estética:** McKinsey-style UI com Framer Motion e Noise Overlay para acabamento premium.

---

**Claudio Tonelli Consultoria**  
*Excelência estratégica desenhada para a era digital.*