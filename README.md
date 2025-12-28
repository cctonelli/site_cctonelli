# Claudio Tonelli Consultoria — Sovereign Master Hub v18.9-MASTER

O ecossistema digital da **Claudio Tonelli Consultoria** atingiu o estágio de **Soberania Master**. Esta plataforma opera como um **Kernel de Estratégia**, onde a gestão da marca, marketplace e editorial ocorre em tempo real através do Command Center.

## 🚀 Status de Evolução: v18.9-SOVEREIGN-MASTER

A plataforma agora é controlada inteiramente via interface administrativa, eliminando a necessidade de hard-coding para ajustes estéticos ou operacionais:

1.  **Visual DNA (Real-time Preview):** Controle total sobre a paleta neon, cores de fundo e escala tipográfica. O Admin pode ajustar o tamanho do `H1` (ex: 9.5rem) e ver a mudança instantaneamente via injeção de CSS Variables.
2.  **Marketplace Forge:** Gestão granular de ativos digitais. Permite forjar novos produtos (como o V8 Matrix), editar variantes de preço, recorrência e descrições estratégicas.
3.  **Editorial Forge:** Sistema completo de publicação de Insights. Transforme análises complexas em artigos com tipografia de luxo e suporte a *Rich Text*.
4.  **Sales Vault (Auditoria PIX):** Fila de processamento de pedidos com integração de perfil. O administrador valida o pagamento e libera o ativo para o Executive Hub do cliente com um clique.
5.  **Matrix UX Control:** Calibragem da experiência imersiva. Ajuste de velocidade, densidade e brilho do fundo Matrix diretamente pelo painel.

---

## 🔐 Infraestrutura & Governança (Supabase)

A segurança é garantida por camadas de **Row Level Security (RLS)** e um modelo híbrido de dados:

| Módulo | Persistência | Protocolo de Segurança |
| :--- | :--- | :--- |
| **Configuração** | `site_content` | Leitura pública, Escrita restrita ao `user_type: admin`. |
| **Marketplace** | `products` & `variants` | Cache local (Registry) + Sincronização Supabase. |
| **Transações** | `orders` | Auditoria manual obrigatória para ativação de licenças. |
| **Identidade** | `profiles` | Dados criptografados e acesso restrito ao proprietário. |

---

## 🛠️ Comandos do Command Center

Para manter a Soberania de Marca:

1.  **DNA Visual:** Ajuste o `Acento Primário` para mudar o tom de toda a interface (Neon Matrix ou Blue Advisory).
2.  **Visibilidade:** Ative ou desative seções inteiras do site (Métricas, Depoimentos, etc.) na aba **Geral & SEO**.
3.  **Auditoria:** Acesse o **Sales Vault** para monitorar transações PIX pendentes.

**Claudio Tonelli Consultoria**  
*Excelência estratégica forjada em código soberano.*