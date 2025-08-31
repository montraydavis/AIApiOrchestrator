import { AzureOpenAI } from "openai";

/**
 * Wrapper class for Azure OpenAI API configuration and client.
 *
 * @class AOAI
 * @property {string | undefined} AOAI_API_KEY - The API key for Azure OpenAI, loaded from environment variable 'AOAI_API_KEY'.
 * @property {string | undefined} AOAI_ENDPOINT - The endpoint URL for Azure OpenAI, loaded from environment variable 'AOAI_ENDPOINT'.
 * @property {string | undefined} AOAI_DEPLOYMENT - The deployment name for the Azure OpenAI model (default: "gpt-4.1").
 * @property {string | undefined} AOAI_API_VERSION - The API version for Azure OpenAI (default: "2024-10-21").
 * @property {AzureOpenAI} client - The AzureOpenAI client instance.
 */
export class AOAI {

  /**
   * The API key for Azure OpenAI, loaded from environment variable 'AOAI_API_KEY'.
   */
  AOAI_API_KEY: string | undefined = process.env['AOAI_API_KEY'];

  /**
   * The endpoint URL for Azure OpenAI, loaded from environment variable 'AOAI_ENDPOINT'.
   */
  AOAI_ENDPOINT: string | undefined = process.env['AOAI_ENDPOINT'];

  /**
   * The deployment name for the Azure OpenAI model (default: "gpt-4.1").
   */
  AOAI_DEPLOYMENT: string | undefined = "gpt-4.1";

  /**
   * The API version for Azure OpenAI (default: "2024-10-21").
   */
  AOAI_API_VERSION: string | undefined = "2024-10-21";

  /**
   * The AzureOpenAI client instance.
   */
  client: AzureOpenAI;

  /**
   * Constructs a new AOAI instance and initializes the AzureOpenAI client.
   * 
   * @constructor
   * @throws {Error} If AOAI_API_KEY or AOAI_ENDPOINT is not set in the environment variables.
   */
  constructor() {
    if (!this.AOAI_API_KEY || !this.AOAI_ENDPOINT) {
      throw new Error('AOAI_API_KEY and AOAI_ENDPOINT must be set');
    }

    this.client = new AzureOpenAI({
      deployment: this.AOAI_DEPLOYMENT,
      apiKey: this.AOAI_API_KEY, 
      endpoint: this.AOAI_ENDPOINT,
      apiVersion: this.AOAI_API_VERSION
    });
  }

  /**
   * Sends a chat message to the Azure OpenAI model and returns the response as a string.
   *
   * @param {string} input - The user input to send to the model.
   * @param {string} [model="gpt-4.1"] - The model deployment name to use (default: "gpt-4.1").
   * @returns {Promise<string>} The response from the model as a string.
   * @throws {Error} If the chat completion request fails.
   */
  async chat(input: string, model: string = "gpt-4.1"): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const events = await this.client.chat.completions.create({
        stream: true,
        messages: [{ role: "user", content: input }],
        max_tokens: 128,
        model: model
      });
      let response = '';
      for await (const event of events) {
        for (const choice of event.choices) {
          response += choice.delta?.content ?? '';
        }
      }
      resolve(response);
    });
  }
}