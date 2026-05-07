import { api } from './api';

export const aiService = {
  async rewriteText(text: string, instruction: string): Promise<string> {
    try {
      const response = await api.post('/llm/rewrite', {
        text,
        instruction
      });
      return response.data.rewrittenText;
    } catch (error) {
      console.error('Errore durante la riscrittura AI:', error);
      throw new Error('Impossibile comunicare con l\'IA');
    }
  }
};