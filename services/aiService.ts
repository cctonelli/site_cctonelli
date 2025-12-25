
import { GoogleGenAI } from "@google/genai";
import { Product, Profile } from "../types";

export const getPersonalizedRecommendations = async (profile: Profile, products: Product[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const productNames = products.map(p => p.name).join(", ");
    const prompt = `
      Como consultor sênior da Claudio Tonelli, recomende um dos seguintes serviços: ${productNames}.
      O cliente é ${profile.full_name}, ${profile.user_type === 'admin' ? 'um administrador' : 'um cliente corporativo'}.
      Contexto adicional: CPF/CNPJ: ${profile.cpf_cnpj || 'Não informado'}.
      Escreva uma recomendação curta, persuasiva e inesquecível, focada em ROI e excelência.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text || "Recomendamos uma análise estratégica personalizada para o seu caso.";
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return "Nossos consultores estão analisando as melhores opções para o seu perfil.";
  }
};
