# Claudio Tonelli Consultoria — Advisory Hub v9.0-ELITE

O ecossistema digital da **Claudio Tonelli Consultoria** atingiu seu estágio máximo de maturidade. Esta plataforma opera agora como uma **Máquina Global de Vendas de Ativos Digitais**, integrando consultoria de elite com automação de e-commerce.

## 🚀 Status de Integração: Estágio Final (Deploy v9.0)

O fluxo de vendas revisado está **100% operacional**, integrado via Supabase Core:

1.  **Vitrine (/loja):** Grid premium consumindo `products` (is_active=true) ordenado por `featured`.
2.  **Dynamic Canvas (/loja/[slug]):** Renderização modular de `product_content_blocks`.
3.  **Checkout PIX:** Geração de QR Code e registro em `orders` com status `pending`.
4.  **Protocolo de Aprovação:** Admin aprova pagamentos, gerando automaticamente acessos em `user_products`.
5.  **Executive Hub:** Liberação via **Realtime Sync** de links FTP e downloads no portal do parceiro.

---

## 🔐 Auditoria de Segurança & Políticas RLS

O sistema segue rigorosamente as políticas de **Row Level Security** do Supabase para garantir integridade total:

| Tabela | Política RLS Ativa | Comportamento de Elite |
| :--- | :--- | :--- |
| `products` | `public_read_products` | Leitura pública do catálogo; Escrita apenas Admin. |
| `product_variants` | `public_read_variants` | Preços e planos acessíveis globalmente. |
| `orders` | `user_read_own_orders` | Clientes vêem apenas seus próprios pedidos; Admin tem `FULL_ACCESS`. |
| `user_products` | `user_read_own_access` | Liberação de ativos via Realtime; Apenas o proprietário acessa. |
| `profiles` | `auth.uid() = id` | Dados sensíveis (CPF/CNPJ, WhatsApp) protegidos por ID. |
| `tools` | `public_read` | Toolkit estratégico disponível conforme nível de acesso. |
| `contacts` | `public_insert` | Captação de leads aberta; leitura restrita ao Advisory Board. |

---

## 🛠️ Stack Tecnológica v9.0

*   **Intelligence:** Google Gemini 3 Pro (Thinking Model) para diagnósticos no Hub.
*   **Engine:** Supabase (Auth, DB, Realtime, Storage).
*   **Visuals:** Three.js (Conexões Globais) + McKinsey Aesthetic (Noise Overlay).
*   **Deploy:** Vercel Edge Runtime com headers de segurança AES-256 (simulado).

---

**Claudio Tonelli Consultoria**  
*Excelência estratégica desenhada para a era digital de alto impacto.*
