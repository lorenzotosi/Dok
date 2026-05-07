import { LLMEngine } from "./LLMEngine.js";
import { Prompt } from "./Prompt.js";
import type { LLMResponse } from "./LLMResponse.js";

export class UseLLM {
    private engine: LLMEngine;

    constructor(apiKey: string) {
        this.engine = new LLMEngine(apiKey);
    }

    /**
     * Prende il testo originale e l'istruzione (es. "rendilo più divertente")
     */
    public async makeCall(text: string, instruction: string): Promise<LLMResponse> {
        const prompt = new Prompt(text, instruction);

        try {
            const response = await this.engine.askLLM(prompt);
            return response;
        } catch (error) {
            throw new Error(`Errore durante la riscrittura del testo: ${error instanceof Error ? error.message : "Errore ignoto"}`);
        }
    }
}