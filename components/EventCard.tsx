import React, { useState, useMemo } from 'react';
import type { EventData, CostItem, Task } from '../types';
import { TrashIcon, PlusIcon, PencilIcon, CalendarIcon, CheckCircleIcon, ChartBarIcon, XIcon, UsersIcon } from './icons';

// --- CURRENCY FORMATTER ---
const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
});

// --- COST BREAKDOWN MODAL COMPONENT ---
interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
  sharedCosts: CostItem[];
  sharedCostPerEvent: number;
}

const CostBreakdownModal: React.FC<CostBreakdownModalProps> = ({ isOpen, onClose, event, sharedCosts, sharedCostPerEvent }) => {
  if (!isOpen || !event) return null;

  const ownCostsTotal = useMemo(() => {
    return event.costItems.reduce((sum, item) => {
      const cost = item.isVariable ? item.amount * event.attendees : item.amount;
      return sum + cost;
    }, 0);
  }, [event]);

  const totalSpent = ownCostsTotal + sharedCostPerEvent;
  const totalSharedCost = sharedCosts.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-700 relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XIcon />
        </button>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-1 shrink-0">
          Desglose de Costos
        </h2>
        <p className="text-lg text-gray-300 mb-2 shrink-0">{event.name}</p>
        <p className="text-sm text-gray-400 mb-6 shrink-0 flex items-center"><UsersIcon /> {event.attendees} Asistentes</p>


        <div className="flex-grow overflow-y-auto space-y-6 pr-2 -mr-4">
          {/* Specific Costs */}
          <div>
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Costos Específicos</h3>
            <ul className="space-y-2">
              {event.costItems.length > 0 ? event.costItems.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                  <div>
                    <span className="text-gray-300 text-sm">{item.description}</span>
                    {item.isVariable && <span className="ml-2 text-xs bg-blue-500/50 text-blue-300 px-1.5 py-0.5 rounded-full">Por Asistente</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-gray-300 text-sm">{currencyFormatter.format(item.isVariable ? item.amount * event.attendees : item.amount)}</span>
                    {item.isVariable && <p className="text-xs font-mono text-gray-500">{currencyFormatter.format(item.amount)} x {event.attendees}</p>}
                  </div>
                </li>
              )) : <p className="text-gray-500 text-sm py-2">Sin costos específicos.</p>}
            </ul>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
                <span className="font-semibold text-gray-300">Subtotal Específicos</span>
                <span className="font-semibold font-mono text-indigo-300">{currencyFormatter.format(ownCostsTotal)}</span>
            </div>
          </div>

          {/* Shared Costs */}
          <div>
            <h3 className="text-lg font-semibold text-purple-300 mb-2">Costos Compartidos</h3>
             <p className="text-xs text-gray-400 mb-3">
                Total de <span className="font-bold">{currencyFormatter.format(totalSharedCost)}</span> dividido entre los eventos activos.
            </p>
            <ul className="space-y-2">
              {sharedCosts.length > 0 ? sharedCosts.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                  <span className="text-gray-300 text-sm">{item.description}</span>
                  <span className="font-mono text-gray-300 text-sm">{currencyFormatter.format(item.amount)}</span>
                </li>
              )) : <p className="text-gray-500 text-sm py-2">Sin costos compartidos.</p>}
            </ul>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
                <span className="font-semibold text-gray-300">Cuota Asignada a este Evento</span>
                <span className="font-semibold font-mono text-purple-300">{currencyFormatter.format(sharedCostPerEvent)}</span>
            </div>
          </div>
        </div>
        
        {/* Total */}
        <div className="mt-6 pt-4 border-t-2 border-gray-600 flex justify-between items-center shrink-0">
            <span className="text-xl font-bold text-gray-200">Gasto Total del Evento</span>
            <span className="text-xl font-bold font-mono text-green-400">{currencyFormatter.format(totalSpent)}</span>
        </div>
      </div>
    </div>
  );
};


// --- EVENT CARD COMPONENT ---
interface EventCardProps {
  event: EventData;
  sharedCosts: CostItem[];
  sharedCostPerEvent: number;
  onUpdateEvent: (updatedEvent: EventData) => void;
  onEdit: (event: EventData) => void;
  onDelete: (eventId: string) => void;
}

const formatDateTimeRange = (startStr: string, endStr: string): string => {
  if (!startStr && !endStr) return 'Fecha no definida';

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  try {
    const startDate = startStr ? new Date(startStr) : null;
    const endDate = endStr ? new Date(endStr) : null;

    const startFormatted = startDate ? `Desde el ${startDate.toLocaleString('es-CL', formatOptions)}` : '';
    const endFormatted = endDate ? ` hasta el ${endDate.toLocaleString('es-CL', formatOptions)}` : '';

    if (startDate && !endDate) return startFormatted;
    if (!startDate && endDate) return `Hasta el ${endDate.toLocaleString('es-CL', formatOptions)}`;

    return `${startFormatted}${endFormatted}`.replace(' a las ', ', ');
  } catch (e) {
    return "Fecha inválida";
  }
};


const AddCostForm: React.FC<{ onAddCost: (description: string, amount: number, isVariable: boolean) => void }> = ({ onAddCost }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isVariable, setIsVariable] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description && amount && parseInt(amount, 10) > 0) {
            onAddCost(description, parseInt(amount, 10), isVariable);
            setDescription('');
            setAmount('');
            setIsVariable(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 mt-3">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nuevo costo específico"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Monto"
                    className="w-28 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    min="1"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-md transition-colors flex items-center justify-center shrink-0">
                    <PlusIcon />
                </button>
            </div>
            <div className="flex items-center">
                <input 
                    id={`variable-cost-${Math.random()}`} // unique id
                    type="checkbox"
                    checked={isVariable}
                    onChange={(e) => setIsVariable(e.target.checked)}
                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`variable-cost-${Math.random()}`} className="ml-2 text-sm text-gray-400">Costo por Asistente</label>
            </div>
        </form>
    );
};

const AddTaskForm: React.FC<{ onAddTask: (description: string, dueDate: string) => void }> = ({ onAddTask }) => {
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description) {
            onAddTask(description, dueDate);
            setDescription('');
            setDueDate('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
            <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nueva tarea"
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
            />
            <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Fecha límite (Opcional)"
                className="w-40 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-md transition-colors flex items-center justify-center shrink-0">
                <PlusIcon />
            </button>
        </form>
    );
};


const EventCard: React.FC<EventCardProps> = ({ event, sharedCosts, sharedCostPerEvent, onUpdateEvent, onEdit, onDelete }) => {
    const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
    
    const ownCostsTotal = useMemo(() => {
        return event.costItems.reduce((sum, item) => {
            const cost = item.isVariable ? item.amount * event.attendees : item.amount;
            return sum + cost;
        }, 0);
    }, [event.costItems, event.attendees]);

    const totalSpent = useMemo(() => ownCostsTotal + sharedCostPerEvent, [ownCostsTotal, sharedCostPerEvent]);
    const remainingBudget = useMemo(() => event.totalBudget - totalSpent, [event.totalBudget, totalSpent]);
    const profitMargin = useMemo(() => event.totalBudget > 0 ? (remainingBudget / event.totalBudget) * 100 : 0, [remainingBudget, event.totalBudget]);

    const handleAddCost = (description: string, amount: number, isVariable: boolean) => {
        const newCost: CostItem = { id: `cost-${Date.now()}`, description, amount, isVariable };
        const updatedEvent = { ...event, costItems: [...event.costItems, newCost] };
        onUpdateEvent(updatedEvent);
    };

    const handleDeleteCost = (costId: string) => {
        const updatedEvent = { ...event, costItems: event.costItems.filter(item => item.id !== costId) };
        onUpdateEvent(updatedEvent);
    };

    const handleAddTask = (description: string, dueDate: string) => {
        const newTask: Task = { id: `task-${Date.now()}`, description, dueDate, isComplete: false };
        const updatedEvent = { ...event, tasks: [...event.tasks, newTask] };
        onUpdateEvent(updatedEvent);
    };

    const handleDeleteTask = (taskId: string) => {
        const updatedEvent = { ...event, tasks: event.tasks.filter(task => task.id !== taskId) };
        onUpdateEvent(updatedEvent);
    };

    const handleToggleTask = (taskId: string) => {
        const updatedTasks = event.tasks.map(task =>
          task.id === taskId ? { ...task, isComplete: !task.isComplete } : task
        );
        const updatedEvent = { ...event, tasks: updatedTasks };
        onUpdateEvent(updatedEvent);
    };

    return (
        <React.Fragment>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-indigo-400">{event.name}</h2>
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-400 mt-1 gap-x-3">
                           <p className="flex items-center"><UsersIcon /> {event.attendees} Asistentes</p>
                           <p className="hidden sm:block">|</p>
                           <p>{formatDateTimeRange(event.startDate, event.endDate)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(event)} className="text-gray-400 hover:text-white p-1 rounded-full"><PencilIcon /></button>
                        <button onClick={() => onDelete(event.id)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><TrashIcon /></button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4 text-center">
                    <div className="bg-gray-900/50 p-2 rounded-lg">
                        <p className="text-xs text-gray-400">Presupuesto</p>
                        <p className="text-lg font-semibold text-gray-200">{currencyFormatter.format(event.totalBudget)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-lg">
                        <p className="text-xs text-gray-400">Gasto Total</p>
                        <p className="text-lg font-semibold text-gray-200">{currencyFormatter.format(totalSpent)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-lg">
                        <p className="text-xs text-gray-400">Disponible</p>
                        <p className={`text-lg font-semibold ${remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {currencyFormatter.format(remainingBudget)}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-lg">
                        <p className="text-xs text-gray-400">Rentabilidad</p>
                        <p className={`text-lg font-semibold ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profitMargin.toFixed(1)}%
                        </p>
                    </div>
                </div>
                
                <div className="text-center mb-6">
                    <button
                        onClick={() => setIsBreakdownModalOpen(true)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center mx-auto gap-2 py-1 px-3 rounded-md hover:bg-indigo-500/10 transition-colors"
                    >
                        <ChartBarIcon />
                        Ver Desglose de Costos
                    </button>
                </div>

                <div className="flex-grow flex flex-col">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Costos Específicos</h3>
                            <div className="max-h-32 overflow-y-auto pr-2 -mr-2 space-y-2">
                                {event.costItems.length > 0 ? event.costItems.map(item => (
                                    <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md list-none">
                                        <div className="flex items-center">
                                            <span className="text-gray-300 text-sm">{item.description}</span>
                                             {item.isVariable && <span className="ml-2 text-xs bg-blue-500/50 text-blue-300 px-1.5 py-0.5 rounded-full">Por Asist.</span>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-gray-300 text-sm">{currencyFormatter.format(item.isVariable ? item.amount * event.attendees : item.amount)}</span>
                                            <button onClick={() => handleDeleteCost(item.id)} className="text-red-500 hover:text-red-400">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                )) : <p className="text-gray-500 text-sm text-center py-2">Sin costos específicos.</p>}
                            </div>
                            <AddCostForm onAddCost={handleAddCost} />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Tareas Pendientes</h3>
                            <div className="max-h-32 overflow-y-auto pr-2 -mr-2 space-y-2">
                                {event.tasks.length > 0 ? event.tasks.map(task => (
                                    <li key={task.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md list-none">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleToggleTask(task.id)}>
                                                {task.isComplete ? <CheckCircleIcon /> : <div className="h-5 w-5 rounded-full border-2 border-gray-400 shrink-0" />}
                                            </button>
                                            <div>
                                                <span className={`text-gray-300 text-sm ${task.isComplete ? 'line-through text-gray-500' : ''}`}>{task.description}</span>
                                                {task.dueDate && (
                                                    <p className={`flex items-center text-xs ${task.isComplete ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        <CalendarIcon /> {task.dueDate}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-400">
                                            <TrashIcon />
                                        </button>
                                    </li>
                                )) : <p className="text-gray-500 text-sm text-center py-2">Sin tareas pendientes.</p>}
                            </div>
                            <AddTaskForm onAddTask={handleAddTask} />
                        </div>
                    </div>
                </div>
            </div>
            <CostBreakdownModal
                isOpen={isBreakdownModalOpen}
                onClose={() => setIsBreakdownModalOpen(false)}
                event={event}
                sharedCosts={sharedCosts}
                sharedCostPerEvent={sharedCostPerEvent}
            />
        </React.Fragment>
    );
};

export default EventCard;