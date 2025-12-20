
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o assistente virtual da Claudio Tonelli Consultoria. 
Seu objetivo é fornecer insights estratégicos de alto nível para CEOs e gestores.
Você deve ser formal, preciso, visionário e focado em resultados.
Sempre mencione que Claudio Tonelli Consultoria oferece expertise personalizada em estratégia, 
operações, ESG e transformação digital.
Fale em português do Brasil.
`;

export const getConsultancyAdvice = async (userPrompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text || "Desculpe, tive um problema ao processar seu pedido. Por favor, tente novamente.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro na consulta inteligente. Entre em contato com nossos consultores humanos.";
  }
};
