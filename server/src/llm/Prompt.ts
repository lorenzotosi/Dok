export class Prompt {
    constructor(
        public text: string,
        public instruction: string
    ) {}

    private static readonly TEMPLATE = `
        You are a professional editor and creative writer.
        Your goal is to rewrite the text provided by the user following a specific instruction.

        Instruction: %INSTRUCTION%
        Text to rewrite: %TEXT%

        Return ONLY a valid JSON object (no markdown, no code fences, no extra text).
        The JSON must have these fields:
        - originalText: the text you received
        - rewrittenText: the text after your edit

        Example:
        {
            "originalText": "...",
            "rewrittenText": "..."
        }
    `;

    public toPromptString(): string {
        return Prompt.TEMPLATE
            .replace("%INSTRUCTION%", this.instruction)
            .replace("%TEXT%", this.text);
    }
}