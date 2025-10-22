import React, { useMemo } from 'react';
import type { EventData } from '../types';

interface ProfitabilityChartProps {
  events: EventData[];
  sharedCostPerEvent: number;
}

interface EventProfitData {
  id: string;
  name: string;
  profitMargin: number;
}

const ProfitabilityChart: React.FC<ProfitabilityChartProps> = ({ events, sharedCostPerEvent }) => {
  const eventsWithProfit = useMemo<EventProfitData[]>(() => {
    return events.map(event => {
      const ownCostsTotal = event.costItems.reduce((sum, item) => {
        const cost = item.isVariable ? item.amount * event.attendees : item.amount;
        return sum + cost;
      }, 0);
      const totalSpent = ownCostsTotal + sharedCostPerEvent;
      const profit = event.totalBudget - totalSpent;
      const profitMargin = event.totalBudget > 0 ? (profit / event.totalBudget) * 100 : 0;
      return {
        id: event.id,
        name: event.name,
        profitMargin: profitMargin,
      };
    });
  }, [events, sharedCostPerEvent]);

  if (events.length === 0) {
    return null; // Don't render the chart if there are no events
  }

  const maxMargin = useMemo(() => {
    const margins = eventsWithProfit.map(e => Math.abs(e.profitMargin));
    const max = Math.max(...margins);
    return max > 0 ? max : 100; // Avoid division by zero and have a sensible default max
  }, [eventsWithProfit]);
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 my-8 border border-gray-700">
      <h2 className="text-xl font-bold text-gray-200 mb-1">Comparación de Rentabilidad</h2>
      <p className="text-sm text-gray-400 mb-6">Visualización del margen de ganancia de cada evento.</p>
      
      <div className="flex justify-around items-end h-64 gap-4 px-4 border-b border-gray-600">
        {eventsWithProfit.map(event => {
          const barHeight = (Math.abs(event.profitMargin) / maxMargin) * 100;
          const barColor = event.profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500';

          return (
            <div key={event.id} className="h-full flex flex-col items-center justify-end w-full max-w-[60px] group" title={`${event.name}: ${event.profitMargin.toFixed(1)}%`}>
              <div className="text-center mb-1">
                 <span className={`text-sm font-bold ${event.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {event.profitMargin.toFixed(1)}%
                 </span>
              </div>
              <div 
                className={`w-full rounded-t-md transition-all duration-300 ease-out group-hover:opacity-100 opacity-80 ${barColor}`}
                style={{ height: `${barHeight}%` }}
              />
            </div>
          );
        })}
      </div>
       <div className="flex justify-around items-start pt-2 px-4">
        {eventsWithProfit.map(event => (
           <span key={event.id} className="text-xs text-gray-400 text-center w-full max-w-[60px] break-words">
              {event.name}
            </span>
        ))}
      </div>
    </div>
  );
};

export default ProfitabilityChart;