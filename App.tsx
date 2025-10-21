
import React, { useState, useMemo } from 'react';
import type { EventData, CostItem } from './types';
import Header from './components/Header';
import EventCard from './components/EventCard';
import SharedCostsCard from './components/SharedCostsCard';
import GeminiAdvisor from './components/GeminiAdvisor';
import ExcelControls from './components/ExcelControls';

const initialEvents: EventData[] = [
  {
    id: 'event1',
    name: 'Los Ríos Atrae',
    date: '7 de Enero, 2026',
    totalBudget: 20500000,
    costItems: [],
    tasks: [],
  },
  {
    id: 'event2',
    name: 'Ruedalab IA',
    date: '8 de Enero, 2026',
    totalBudget: 20500000,
    costItems: [],
    tasks: [],
  },
];

const initialSharedCosts: CostItem[] = [
  { id: 'sc1', description: 'Pago Proyectista', amount: 2000000 },
  { id: 'sc2', description: 'Pago Productor Boris Gonzalez', amount: 1200000 },
  { id: 'sc3', description: 'Productora (para ambos eventos)', amount: 0 },
  { id: 'sc4', description: 'Hotel: Salón para 150 personas', amount: 0 },
  { id: 'sc5', description: 'Hotel: 1 Coffee Break', amount: 0 },
  { id: 'sc6', description: 'Hotel: Almuerzo Sky Bar (20pax, 7 Ene)', amount: 0 },
  { id: 'sc7', description: 'Hotel: Almuerzo Sky Bar (20pax, 8 Ene)', amount: 0 },
  { id: 'sc8', description: 'Hotel: Rueda de Negocios (50pax, 7 Ene)', amount: 0 },
  { id: 'sc9', description: 'Hotel: Rueda de Negocios (50pax, 8 Ene)', amount: 0 },
  { id: 'sc10', description: 'Hotel: Cocktail Clausura/Inauguración (150pax)', amount: 0 },
  { id: 'sc11', description: 'Hotel: Alojamiento 15 invitados', amount: 0 },
  { id: 'sc12', description: 'Amplificación y microfonía', amount: 0 },
  { id: 'sc13', description: 'Iluminación', amount: 0 },
  { id: 'sc14', description: 'Pantallas gigantes LED', amount: 0 },
  { id: 'sc15', description: 'Transporte: Avión', amount: 0 },
  { id: 'sc16', description: 'Transporte: Traslados locales', amount: 0 },
];

const App: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [sharedCosts, setSharedCosts] = useState<CostItem[]>(initialSharedCosts);

  const handleUpdateEvent = (updatedEvent: EventData) => {
    setEvents(events.map(event => event.id === updatedEvent.id ? updatedEvent : event));
  };
  
  const totalSharedCost = useMemo(() => sharedCosts.reduce((sum, item) => sum + item.amount, 0), [sharedCosts]);
  const sharedCostPerEvent = useMemo(() => totalSharedCost / (events.length || 1), [totalSharedCost, events.length]);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-12">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <ExcelControls 
            events={events}
            sharedCosts={sharedCosts}
            setEvents={setEvents}
            setSharedCosts={setSharedCosts}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard 
              key={event.id}
              event={event}
              sharedCostPerEvent={sharedCostPerEvent}
              onUpdateEvent={handleUpdateEvent}
            />
          ))}
          <SharedCostsCard
            costs={sharedCosts}
            onUpdateCosts={setSharedCosts}
            eventCount={events.length}
          />
        </div>
        <GeminiAdvisor events={events} sharedCosts={sharedCosts} />
      </main>
    </div>
  );
};

export default App;
