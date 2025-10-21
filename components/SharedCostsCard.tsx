
import React, { useState, useMemo } from 'react';
import type { CostItem } from '../types';
import { TrashIcon, PlusIcon } from './icons';

interface SharedCostsCardProps {
  costs: CostItem[];
  onUpdateCosts: (updatedCosts: CostItem[]) => void;
  eventCount: number;
}

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
});

const SharedCostForm: React.FC<{ onAddCost: (description: string, amount: number) => void }> = ({ onAddCost }) => {
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
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto"
                className="w-32 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-md transition-colors flex items-center justify-center">
                <PlusIcon />
            </button>
        </form>
    );
};


const SharedCostsCard: React.FC<SharedCostsCardProps> = ({ costs, onUpdateCosts, eventCount }) => {
  const totalSharedCost = useMemo(() => costs.reduce((sum, item) => sum + item.amount, 0), [costs]);

  const handleAddCost = (description: string, amount: number) => {
    const newCost: CostItem = { id: Date.now().toString(), description, amount };
    onUpdateCosts([...costs, newCost]);
  };

  const handleDeleteCost = (costId: string) => {
    onUpdateCosts(costs.filter(item => item.id !== costId));
  };
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 flex flex-col h-full">
      <h2 className="text-2xl font-bold text-purple-400">Costos Compartidos</h2>
      <p className="text-sm text-gray-400 mb-4">Infraestructura, tecnología y servicios comunes.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-400">Total Compartido</p>
          <p className="text-2xl font-semibold text-gray-200">{currencyFormatter.format(totalSharedCost)}</p>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-400">Costo por Evento</p>
          <p className="text-2xl font-semibold text-gray-200">{currencyFormatter.format(totalSharedCost / eventCount)}</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-300 mb-2">Lista de Costos</h3>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 max-h-60">
        <ul className="space-y-2">
          {costs.map(item => (
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
           {costs.length === 0 && <p className="text-gray-500 text-center py-4">Sin costos compartidos añadidos.</p>}
        </ul>
      </div>

      <SharedCostForm onAddCost={handleAddCost} />
    </div>
  );
};

export default SharedCostsCard;
