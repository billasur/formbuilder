import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with your key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Track token usage
let tokenUsage = {
  totalTokensUsed: 0,
  lastRequestTokens: 0,
  requestsCount: 0
};

export const getTokenUsage = () => {
  return { ...tokenUsage };
};

export const generateFormWithAI = async (prompt: string) => {
  try {
    // For Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a structured prompt
    const fullPrompt = `
      Act as a professional form builder. Create a detailed JSON structure for a form based on this description:
      "${prompt}"
      
      Return ONLY a valid JSON object with this structure:
      {
        "fields": [
          {
            "id": "unique-id-1",
            "type": "text|email|select|checkbox|radio|textarea|date|time|number|file",
            "label": "Field Label",
            "placeholder": "Placeholder text",
            "required": true|false,
            "options": ["Option 1", "Option 2"] // Only for select, checkbox, radio
            "tooltip": "Help text" // Optional
          }
        ],
        "settings": {
          "submitButtonText": "Submit",
          "showProgressBar": true|false
        }
      }
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Update token usage
    // Note: Gemini doesn't directly provide token counts like OpenAI
    // This is an estimation based on characters
    const estimatedTokens = Math.ceil(fullPrompt.length / 4) + Math.ceil(text.length / 4);
    tokenUsage.lastRequestTokens = estimatedTokens;
    tokenUsage.totalTokensUsed += estimatedTokens;
    tokenUsage.requestsCount += 1;
    
    // Extract the JSON part
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                       text.match(/```\n([\s\S]*?)\n```/) || 
                       text.match(/{[\s\S]*}/);
                       
    let formData;
    if (jsonMatch) {
      formData = JSON.parse(jsonMatch[0].replace(/```json\n|```\n|```/g, ''));
    } else {
      formData = JSON.parse(text);
    }
    
    // Add token usage to the response
    return {
      ...formData,
      tokensUsed: tokenUsage.lastRequestTokens
    };
  } catch (error) {
    console.error('Error generating form with AI:', error);
    throw new Error('Failed to generate form structure with AI');
  }
} 