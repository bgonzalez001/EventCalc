
import React, { useState, useMemo } from 'react';
import type { EventData, CostItem, Task } from '../types';
import { TrashIcon, PlusIcon, PencilIcon, CalendarIcon, CheckCircleIcon } from './icons';

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
});

// --- SUB-COMPONENTS FOR COSTS ---

const CostItemForm: React.FC<{ onAddCost: (description: string, amount: number) => void }> = ({ onAddCost }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description && amount) {
            onAddCost(description, parseInt(amount, 10));
            setDescription('');
            setAmount('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 p-3 bg-gray-800/50 rounded-lg">
            <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nueva descripción de costo"
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto"
                className="w-32 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-md transition-colors flex items-center justify-center">
                <PlusIcon />
            </button>
        </form>
    );
};

// --- SUB-COMPONENTS FOR TASKS ---

const TaskItem: React.FC<{ task: Task; onUpdate: (updatedTask: Task) => void; onDelete: (taskId: string) => void; }> = ({ task, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(task.description);
    const [dueDate, setDueDate] = useState(task.dueDate);

    const handleSave = () => {
        onUpdate({ ...task, description, dueDate });
        setIsEditing(false);
    };

    const handleToggleComplete = () => {
        onUpdate({ ...task, isComplete: !task.isComplete });
    };

    return (
        <li className={`flex items-center gap-3 p-2 rounded-md ${task.isComplete ? 'bg-gray-700/30' : 'bg-gray-700/50'}`}>
            <input type="checkbox" checked={task.isComplete} onChange={handleToggleComplete} className="form-checkbox h-5 w-5 rounded bg-gray-600 text-indigo-500 border-gray-500 focus:ring-indigo-600" />
            
            {isEditing ? (
                <div className="flex-grow flex gap-2">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="flex-grow bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-sm text-white" />
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-sm text-white" />
                </div>
            ) : (
                <div className={`flex-grow ${task.isComplete ? 'line-through text-gray-400' : 'text-gray-300'}`}>
                    <p>{task.description}</p>
                    <div className="flex items-center text-xs text-gray-400">
                        <CalendarIcon />
                        <span>{dueDate || 'Sin fecha'}</span>
                    </div>
                </div>
            )}
            
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <button onClick={handleSave} className="text-green-400 hover:text-green-300"><CheckCircleIcon /></button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="text-yellow-400 hover:text-yellow-300"><PencilIcon /></button>
                )}
                <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-400"><TrashIcon /></button>
            </div>
        </li>
    );
};

const TaskManager: React.FC<{ tasks: Task[]; onUpdateTasks: (updatedTasks: Task[]) => void; }> = ({ tasks, onUpdateTasks }) => {
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [showTasks, setShowTasks] = useState(false);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (description) {
            const newTask: Task = { id: Date.now().toString(), description, dueDate, isComplete: false };
            onUpdateTasks([...tasks, newTask]);
            setDescription('');
            setDueDate('');
        }
    };

    const handleUpdateTask = (updatedTask: Task) => {
        onUpdateTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    };

    const handleDeleteTask = (taskId: string) => {
        onUpdateTasks(tasks.filter(task => task.id !== taskId));
    };
    
    const pendingTasks = tasks.filter(t => !t.isComplete);
    const completedTasks = tasks.filter(t => t.isComplete);

    return (
         <div className="mt-6">
            <button onClick={() => setShowTasks(!showTasks)} className="w-full text-left text-lg font-semibold text-gray-300 mb-2 focus:outline-none flex justify-between items-center">
                <span>Tareas Pendientes ({pendingTasks.length})</span>
                <span className={`transform transition-transform ${showTasks ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showTasks && (
                <div className="border-t border-gray-700 pt-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 -mr-2 mb-4">
                        {pendingTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />)}
                        {pendingTasks.length === 0 && <p className="text-gray-500 text-center py-2">¡Ninguna tarea pendiente!</p>}
                    </div>

                    {completedTasks.length > 0 && (
                        <>
                          <h4 className="text-md font-semibold text-gray-400 mt-4 mb-2">Completadas ({completedTasks.length})</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 -mr-2 mb-4">
                             {completedTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />)}
                          </div>
                        </>
                    )}

                    <form onSubmit={handleAddTask} className="flex gap-2 mt-4 p-3 bg-gray-800/50 rounded-lg">
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nueva tarea" className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md"><PlusIcon /></button>
                    </form>
                </div>
            )}
        </div>
    )
};


// --- MAIN EVENT CARD COMPONENT ---

const EventCard: React.FC<{ event: EventData; sharedCostPerEvent: number; onUpdateEvent: (updatedEvent: EventData) => void; }> = ({ event, sharedCostPerEvent, onUpdateEvent }) => {
  const ownCostsTotal = useMemo(() => event.costItems.reduce((sum, item) => sum + item.amount, 0), [event.costItems]);
  const totalSpent = ownCostsTotal + sharedCostPerEvent;
  const remainingBudget = event.totalBudget - totalSpent;

  const handleAddCost = (description: string, amount: number) => {
    const newCost: CostItem = { id: Date.now().toString(), description, amount };
    onUpdateEvent({ ...event, costItems: [...event.costItems, newCost] });
  };

  const handleDeleteCost = (costId: string) => {
    onUpdateEvent({ ...event, costItems: event.costItems.filter(item => item.id !== costId) });
  };

  const handleUpdateTasks = (updatedTasks: Task[]) => {
      onUpdateEvent({ ...event, tasks: updatedTasks });
  };

  const getRemainingBudgetClass = () => {
    const percentage = (remainingBudget / event.totalBudget) * 100;
    if (percentage < 15) return 'text-red-400';
    if (percentage < 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 flex flex-col h-full">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400">{event.name}</h2>
        <p className="text-sm text-gray-400 mb-4">{event.date}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-sm text-gray-400">Presupuesto Total</p>
            <p className="text-xl font-semibold text-gray-200">{currencyFormatter.format(event.totalBudget)}</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-sm text-gray-400">Gasto Total</p>
            <p className="text-xl font-semibold text-gray-200">{currencyFormatter.format(totalSpent)}</p>
          </div>
        </div>
        
        <div className={`bg-gray-900/50 p-4 rounded-lg text-center mb-6`}>
          <p className="text-lg text-gray-300">Presupuesto Disponible</p>
          <p className={`text-5xl font-extrabold ${getRemainingBudgetClass()}`}>
            {currencyFormatter.format(remainingBudget)}
          </p>
        </div>

        <h3 className="text-lg font-semibold text-gray-300 mb-2">Costos Específicos del Evento</h3>
        <div className="overflow-y-auto pr-2 -mr-2 max-h-40">
          <ul className="space-y-2">
            {event.costItems.map(item => (
              <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                <span className="text-gray-300">{item.description}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-300">{currencyFormatter.format(item.amount)}</span>
                  <button onClick={() => handleDeleteCost(item.id)} className="text-red-500 hover:text-red-400">
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
             {event.costItems.length === 0 && <p className="text-gray-500 text-center py-4">Sin costos específicos añadidos.</p>}
          </ul>
        </div>
        
        <CostItemForm onAddCost={handleAddCost} />
      </div>
      <TaskManager tasks={event.tasks} onUpdateTasks={handleUpdateTasks} />
    </div>
  );
};

export default EventCard;
