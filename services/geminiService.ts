import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAiAdvice = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    let errorMessage = "Lo siento, ha ocurrido un error inesperado al contactar al asistente de IA. Por favor, inténtalo de nuevo más tarde.";

    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('fetch failed') || error.message.toLowerCase().includes('network')) {
            errorMessage = "Error de red: No se pudo conectar con el servicio de IA. Por favor, revisa tu conexión a internet e inténtalo de nuevo.";
        } else if (error.message.includes('API key not valid')) {
            errorMessage = "Error de autenticación: La clave de API no es válida. Por favor, verifica la configuración.";
        } else if (error.message.toLowerCase().includes('blocked')) {
            errorMessage = "Tu solicitud fue bloqueada por políticas de seguridad. Por favor, ajusta tu pregunta.";
        } else {
             errorMessage = `Ha ocurrido un error con el servicio de IA: ${error.message}`;
        }
    }
    
    return errorMessage;
  }
};