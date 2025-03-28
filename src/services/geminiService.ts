import axios from 'axios';

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const generateFormFromPrompt = async (prompt: string): Promise<any> => {
  try {
    const response = await axios.post<GeminiResponse>(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Generate a form structure for: ${prompt}. Include field titles, descriptions, field types, and validation rules. Format the response as JSON that can be parsed by JavaScript.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      }
    );

    // Extract the response text
    const responseText = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response (handling potential markdown code blocks)
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                      responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, responseText];
    
    const jsonString = jsonMatch[1].trim();
    
    // Parse the JSON
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error generating form with Gemini:', error);
    throw new Error('Failed to generate form content');
  }
}; 