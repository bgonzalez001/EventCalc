import React, { useState } from 'react';
import type { EventData, CostItem } from '../types';
import { getAiAdvice } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface GeminiAdvisorProps {
  events: EventData[];
  sharedCosts: CostItem[];
}

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
});

const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ events, sharedCosts }) => {
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buildPrompt = () => {
    if (events.length === 0) {
        return "Eres un asesor experto en producción de eventos. El usuario aún no ha creado ningún evento. Anímale a crear su primer evento para poder empezar a planificar y usar tus servicios de asesoría."
    }
    const sharedCostsTotal = sharedCosts.reduce((sum, item) => sum + item.amount, 0);
    const sharedCostPerEvent = sharedCostsTotal / events.length;

    let context = `Eres un asesor experto en producción de eventos. Estoy planificando ${events.length} evento(s). Aquí está el resumen financiero actual:\n\n`;

    events.forEach(event => {
      const ownCostsTotal = event.costItems.reduce((sum, item) => sum + item.amount, 0);
      const totalSpent = ownCostsTotal + sharedCostPerEvent;
      const remainingBudget = event.totalBudget - totalSpent;

      context += `Evento: ${event.name}\n`;
      context += `- Presupuesto Total: ${currencyFormatter.format(event.totalBudget)}\n`;
      context += `- Gasto Total: ${currencyFormatter.format(totalSpent)}\n`;
      context += `- Presupuesto Disponible: ${currencyFormatter.format(remainingBudget)}\n\n`;
    });
    
    context += `Costos compartidos entre todos los eventos suman: ${currencyFormatter.format(sharedCostsTotal)}\n\n`;
    context += `Mi pregunta es: "${question || 'Dame un consejo general sobre cómo optimizar mis presupuestos.'}".\n\n`;
    context += `Por favor, dame tu consejo de forma clara, concisa y orientada a la acción. Usa markdown para formatear tu respuesta.`;

    return context;
  };

  const handleGetAdvice = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setAdvice('');
    const prompt = buildPrompt();
    try {
      const result = await getAiAdvice(prompt);
      setAdvice(result);
    } catch (error) {
      console.error(error);
      setAdvice("Hubo un error al obtener la asesoría. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 mt-8">
      <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-2">
        <SparklesIcon /> Asesor de IA Gemini
      </h2>
      <p className="text-sm text-gray-400 mb-4">Obtén orientación y consejos para optimizar tus eventos.</p>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={events.length === 0 ? "Crea un evento para usar el asesor" : "Ej: ¿Cómo puedo reducir costos en catering?"}
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-700/50"
          disabled={isLoading || events.length === 0}
        />
        <button 
          onClick={handleGetAdvice}
          disabled={isLoading || events.length === 0}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
        >
          {isLoading ? (
             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Pedir Consejo'
          )}
        </button>
      </div>

      {advice && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 max-h-80 overflow-y-auto">
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br />') }} />
        </div>
      )}
    </div>
  );
};

export default GeminiAdvisor;
