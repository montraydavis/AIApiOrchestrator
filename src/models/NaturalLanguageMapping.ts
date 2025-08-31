/**
 * Represents a mapping from a natural language input to resolved API parameters and body content.
 *
 * @property input - The natural language description provided by the user.
 * @property resolvedParams - (Optional) The query parameters resolved by AI from the input.
 * @property resolvedBody - (Optional) The body content resolved by AI from the input.
 * @property lastUpdated - The date and time when this mapping was last updated.
 * @property confidence - (Optional) The AI's confidence score for this mapping (range: 0-1).
 */
export interface NaturalLanguageMapping {
    /** Natural language description provided by the user. */
    input: string;
    /** AI-resolved query parameters. */
    resolvedParams?: Record<string, any>;
    /** AI-resolved body content. */
    resolvedBody?: any;
    /** The date and time when this mapping was last updated. */
    lastUpdated: Date;
    /** AI confidence score (0-1). */
    confidence?: number;
}
