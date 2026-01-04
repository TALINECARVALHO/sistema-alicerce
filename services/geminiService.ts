
import { GoogleGenAI } from "@google/genai";

class GeminiService {
  /**
   * Inicializa o cliente e gera conteúdo.
   * A instância é criada dentro do método para garantir o uso da chave mais recente.
   */
  async generateContent(prompt: string, isComplex: boolean = false): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });
    // User requested specific models; ensuring they are used if available, otherwise using standard ones might be safer but sticking to user intent.
    const modelName = isComplex ? 'gemini-2.0-flash' : 'gemini-2.0-flash';

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.9,
          systemInstruction: "Você é o 'Alicerce AI', um consultor especializado em licitações e contratos públicos brasileiros (Lei 14.133/21). Seu tom é formal, técnico e imparcial. Ajude a redigir documentos ou analisar propostas comerciais para prefeituras."
        }
      });

      return response.text || "Não foi possível processar a solicitação.";
    } catch (error) {
      console.error("Erro Gemini:", error);
      return "O serviço de inteligência artificial está temporariamente indisponível.";
    }
  }

  async suggestDescription(title: string, type: string): Promise<string> {
    const prompt = `Como um gestor público, redija uma descrição técnica detalhada para a aquisição de: "${title}". O tipo da demanda é ${type}. Use termos técnicos e foque em qualidade e durabilidade.`;
    return this.generateContent(prompt);
  }

  async generateTechnicalOpinion(demandTitle: string, winnerName: string, winnerValue: number, allProposals: any[]): Promise<string> {
    const context = JSON.stringify(allProposals);
    const prompt = `Gere um Parecer Técnico de Homologação para a demanda "${demandTitle}". 
    Vencedor Selecionado: ${winnerName} pelo valor de R$ ${winnerValue.toLocaleString('pt-BR')}.
    Dados de todas as propostas para comparação: ${context}.
    O parecer deve justificar a escolha com base no princípio da economicidade e atender aos requisitos do edital. Seja conciso e profissional.`;
    return this.generateContent(prompt, true);
  }
}

export const geminiService = new GeminiService();
