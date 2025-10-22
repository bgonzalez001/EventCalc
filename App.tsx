import React, { useState, useMemo } from 'react';
import type { EventData, CostItem } from './types';
import Header from './components/Header';
import EventCard from './components/EventCard';
import SharedCostsCard from './components/SharedCostsCard';
import GeminiAdvisor from './components/GeminiAdvisor';
import ProfitabilityChart from './components/ProfitabilityChart';
import ExcelControls from './components/ExcelControls';
import { LiveAssistant } from './components/LiveAssistant';
import EventModal from './components/EventModal';
import { PlusIcon } from './components/icons';

const initialSharedCosts: CostItem[] = [
  { id: 'sc1', description: 'Pago Proyectista', amount: 2000000 },
  { id: 'sc2', description: 'Pago Productor General', amount: 1200000 },
  { id: 'sc3', description: 'Servicios de Productora', amount: 0 },
  { id: 'sc4', description: 'Arriendo de Salón Principal', amount: 0 },
  { id: 'sc5', description: 'Servicio de Coffee Break', amount: 0 },
  { id: 'sc6', description: 'Almuerzos Ejecutivos', amount: 0 },
  { id: 'sc7', description: 'Ruedas de Negocios (Catering)', amount: 0 },
  { id: 'sc8', description: 'Cocktail de Cierre', amount: 0 },
  { id: 'sc9', description: 'Alojamiento para Invitados', amount: 0 },
  { id: 'sc10', description: 'Equipos de Amplificación', amount: 0 },
  { id: 'sc11', description: 'Equipos de Iluminación', amount: 0 },
  { id: 'sc12', description: 'Pantallas LED', amount: 0 },
  { id: 'sc13', description: 'Transporte Aéreo', amount: 0 },
  { id: 'sc14', description: 'Transporte Local (Transfers)', amount: 0 },
];

const App: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [sharedCosts, setSharedCosts] = useState<CostItem[]>(initialSharedCosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

  const handleUpdateEvent = (updatedEvent: EventData) => {
    setEvents(events.map(event => event.id === updatedEvent.id ? updatedEvent : event));
  };
  
  const totalSharedCost = useMemo(() => sharedCosts.reduce((sum, item) => sum + item.amount, 0), [sharedCosts]);
  const sharedCostPerEvent = useMemo(() => totalSharedCost / (events.length || 1), [totalSharedCost, events.length]);

  const handleOpenModal = (event: EventData | null = null) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  const handleSaveEvent = (eventData: Omit<EventData, 'id' | 'costItems' | 'tasks'> & { id?: string }) => {
    if (eventData.id) { // Editing existing event
      setEvents(events.map(e => e.id === eventData.id ? { ...e, ...eventData } : e));
    } else { // Adding new event
      const newEvent: EventData = {
        id: `event-${Date.now()}`,
        name: eventData.name,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        totalBudget: eventData.totalBudget,
        attendees: eventData.attendees,
        costItems: [],
        tasks: [],
      };
      setEvents([...events, newEvent]);
    }
    handleCloseModal();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.")) {
      setEvents(events.filter(e => e.id !== eventId));
    }
  };

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

        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-300">Mis Eventos</h2>
            <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition-colors">
                <PlusIcon /> <span className="hidden sm:inline">Crear Evento</span>
            </button>
        </div>
        
        {events.length > 0 && (
          <ProfitabilityChart events={events} sharedCostPerEvent={sharedCostPerEvent} />
        )}

        {events.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <EventCard 
                key={event.id}
                event={event}
                sharedCosts={sharedCosts}
                sharedCostPerEvent={sharedCostPerEvent}
                onUpdateEvent={handleUpdateEvent}
                onEdit={handleOpenModal}
                onDelete={handleDeleteEvent}
              />
            ))}
            <SharedCostsCard
              costs={sharedCosts}
              onUpdateCosts={setSharedCosts}
              eventCount={events.length}
            />
          </div>
        ) : (
            <div className="text-center py-16 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700">
                <h3 className="text-xl font-semibold text-gray-400">No tienes eventos planificados.</h3>
                <p className="text-gray-500 mt-2">Haz clic en "Crear Evento" para empezar a organizar.</p>
            </div>
        )}

        <GeminiAdvisor events={events} sharedCosts={sharedCosts} />
      </main>
      <LiveAssistant events={events} sharedCosts={sharedCosts} />

      <EventModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        event={editingEvent}
      />
    </div>
  );
};

export default App;