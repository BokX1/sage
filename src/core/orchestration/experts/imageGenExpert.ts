import { ExpertPacket } from './types';
import { LLMMessageContent, LLMChatMessage } from '../../llm/types';
import { logger } from '../../../utils/logger';
import { getLLMClient } from '../../llm';

export interface ImageGenParams {
    userText: string;
    userContent?: LLMMessageContent;
    replyReferenceContent?: LLMMessageContent | null;
    conversationHistory?: LLMChatMessage[];
    apiKey?: string;
}

const IMAGE_REFINER_SYSTEM_PROMPT = `You are a Lead AI Art Director and Prompt Engineer.
Your task: Transform the user's request into a highly optimized image generation prompt.

Inputs:
1. User Request
2. Conversation Context (to resolve references like "it", "that", "her")
3. Reply Context (if user replied to a specific message)
4. Input Image (visual context - if present)

Instructions:
- **Dynamic Adaptation**: Match the user's goals. Do not force specific styles or quality keywords unless they fit the request.
- **Strict Intent**: Follow the user's intent 1:1. Do not censor or hallucinate constraints. If the user asks for specific content, ensure it is in the prompt.
- **Image Handling**: If an image is provided, use it as the base reference. If no image is provided, interpret the text request to the best of your ability.
- **Output**: Output ONLY the final English prompt text. No conversational filler.`;

/**
 * Helper to extract text from content
 */
function extractText(content?: LLMMessageContent | null): string | undefined {
    if (!content) return undefined;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .filter(p => p.type === 'text')
            .map(p => p.text)
            .join(' ');
    }
    return undefined;
}

/**
 * Refine the user's prompt using an LLM (Gemini).
 */
async function refinePrompt(
    userText: string,
    history: LLMChatMessage[],
    apiKey?: string,
    imageUrl?: string,
    replyContext?: string
): Promise<string> {
    try {
        const client = getLLMClient();

        // Construct messages for Refiner
        // History: Last 10 messages
        const contextMessages = history.slice(-10);

        const messages: LLMChatMessage[] = [
            { role: 'system', content: IMAGE_REFINER_SYSTEM_PROMPT },
            ...contextMessages,
        ];

        // Inject Reply Context if strictly relevant
        if (replyContext) {
            messages.push({
                role: 'system',
                content: `CONTEXT: The user is replying to this message: "${replyContext}"`
            });
        }

        // Current user message
        if (imageUrl) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: `Request: ${userText}` },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            });
        } else {
            messages.push({
                role: 'user',
                content: `Request: ${userText}`
            });
        }

        const response = await client.chat({
            messages,
            model: 'gemini', // Explicitly use Gemini for reasoning/vision
            temperature: 0.8, // High creativity
            maxTokens: 1000,
            apiKey,
        });

        const refined = response.content.trim();
        logger.debug({ original: userText, replyContext: !!replyContext, refined }, '[ImageGen] Prompt refined');
        return refined;
    } catch (error) {
        logger.warn({ error }, '[ImageGen] Refiner failed, falling back to raw prompt');
        return userText;
    }
}

/**
 * Image Generation Expert
 * 
 * Responsibilities:
 * 1. Gather context (text + images)
 * 2. Refine prompt via LLM
 * 3. Fetch image bytes from Pollinations (flux/klein)
 */
export async function runImageGenExpert(params: ImageGenParams): Promise<ExpertPacket> {
    const { userText, userContent, replyReferenceContent, conversationHistory = [], apiKey } = params;

    try {
        // 1. Resolve Attachment (Priority: Direct > Reply)
        // NO Fallback to History.
        let attachmentUrl: string | undefined;

        // A. Direct Attachment (Current Message)
        if (Array.isArray(userContent)) {
            const img = userContent.find(p => p.type === 'image_url');
            if (img && img.type === 'image_url') attachmentUrl = img.image_url.url;
        }

        // B. Reply Attachment (Explicit Reference)
        if (!attachmentUrl && replyReferenceContent && Array.isArray(replyReferenceContent)) {
            const img = replyReferenceContent.find(p => p.type === 'image_url');
            if (img && img.type === 'image_url') attachmentUrl = img.image_url.url;
        }

        // Extract Reply Text Context (even if no image)
        const replyText = extractText(replyReferenceContent);

        // 2. Refine Prompt
        const prompt = await refinePrompt(userText, conversationHistory, apiKey, attachmentUrl, replyText);

        // 3. Construct URL
        const model = 'klein-large';
        const seed = Math.floor(Math.random() * 1_000_000);
        const encodedPrompt = encodeURIComponent(prompt);

        // NEW Unified Endpoint: https://gen.pollinations.ai/image/{prompt}
        let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model}&nologo=true&seed=${seed}`;

        if (attachmentUrl) {
            url += `&image=${encodeURIComponent(attachmentUrl)}`;
        }

        if (apiKey) {
            url += `&key=${encodeURIComponent(apiKey)}`;
        }

        logger.info({ prompt, hasAttachment: !!attachmentUrl, url }, '[ImageGen] Fetching image...');

        // 4. Fetch Image Bytes
        const response = await fetch(url);
        if (!response.ok) {
            const errText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Pollinations API error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // safe filename
        const safePrompt = prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_');
        const filename = `sage_${safePrompt}_${seed}.jpg`;

        return {
            name: 'ImageGenerator',
            content: `[ImageGen] IMAGE GENERATED SUCCESSFULLY.
SYSTEM INSTRUCTION: The image is ALREADY ATTACHED to this message.
CRITICAL: Do **NOT** output any JSON. Do **NOT** verify the action.
Your ONLY job is to assume the persona and narrate the image to the user.
Example: "Here is your cyberpunk masterpiece."
NOT: "{ action: ... }"`,
            binary: {
                data: buffer,
                filename,
                mimetype: 'image/jpeg'
            },
            // Do not put binary in json to avoid clogging traces
            json: {
                originalPrompt: userText,
                refinedPrompt: prompt,
                model,
                seed,
                hasAttachment: !!attachmentUrl,
                url
            }
        };

    } catch (error) {
        logger.error({ error, userText }, '[ImageGen] Failed to generate image');
        return {
            name: 'ImageGenerator',
            content: `[ImageGenerator] Failed to generate image: ${error instanceof Error ? error.message : String(error)}`,
            tokenEstimate: 20
        };
    }
}
