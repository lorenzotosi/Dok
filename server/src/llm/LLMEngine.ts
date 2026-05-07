import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { Prompt } from "./Prompt.ts";
import type { LLMResponse } from "./LLMResponse.ts";

export class LLMEngine {
    private readonly maxRetries = 3;
    private model: GenerativeModel;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    public async askLLM(prompt: Prompt): Promise<LLMResponse> {
        const promptString = prompt.toPromptString();

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await this.model.generateContent(promptString);
                const response = await result.response;
                const rawText = response.text();

                const jsonString = rawText.replace(/```json|```/gi, "").trim();
                
                return JSON.parse(jsonString) as LLMResponse;

            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt === this.maxRetries) {
                    throw new Error(`Failed to get a valid response after ${this.maxRetries} attempts`);
                }
            }
        }
        throw new Error("Unexpected Engine failure");
    }
}