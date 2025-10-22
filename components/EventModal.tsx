import React, { useState, useEffect } from 'react';
// Fix: Correctly import EventData from the updated types.ts file.
import type { EventData } from '../types';
import { XIcon } from './icons';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<EventData, 'id' | 'costItems' | 'tasks'> & { id?: string }) => void;
  event: EventData | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, event }) => {
  const [name, setName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [attendees, setAttendees] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [formErrors, setFormErrors] = useState<{ budget?: string, attendees?: string }>({});

  useEffect(() => {
    if (isOpen) {
        if (event) {
            setName(event.name);
            setTotalBudget(event.totalBudget.toString());
            setAttendees(event.attendees.toString());

            const start = event.startDate ? new Date(event.startDate) : null;
            const end = event.endDate ? new Date(event.endDate) : null;

            setStartDate(start ? start.toISOString().split('T')[0] : '');
            setStartTime(start ? start.toTimeString().slice(0, 5) : '');
            setEndDate(end ? end.toISOString().split('T')[0] : '');
            setEndTime(end ? end.toTimeString().slice(0, 5) : '');
        } else {
            setName('');
            setTotalBudget('');
            setAttendees('0');
            setStartDate('');
            setStartTime('');
            setEndDate('');
            setEndTime('');
        }
        setFormErrors({});
    }
  }, [event, isOpen]);

  const validateForm = () => {
    const errors: { budget?: string, attendees?: string } = {};
    const budgetAmount = parseInt(totalBudget, 10);
    const attendeesCount = parseInt(attendees, 10);

    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      errors.budget = 'El presupuesto debe ser un número positivo.';
    }
    if (isNaN(attendeesCount) || attendeesCount < 0) {
        errors.attendees = 'El número de asistentes no puede ser negativo.'
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (name && totalBudget) {
      const startDateTime = startDate && startTime ? `${startDate}T${startTime}:00` : '';
      const endDateTime = endDate && endTime ? `${endDate}T${endTime}:00` : '';
      
      onSave({
        id: event?.id,
        name,
        totalBudget: parseInt(totalBudget, 10),
        attendees: parseInt(attendees, 10) || 0,
        startDate: startDateTime,
        endDate: endDateTime,
      });
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XIcon />
        </button>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-6">
          {event ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nombre del Evento</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-1">Presupuesto Total (CLP)</label>
              <input
                id="budget"
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                required
                className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${formErrors.budget ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-indigo-500'}`}
              />
              {formErrors.budget && <p className="text-red-500 text-sm mt-1">{formErrors.budget}</p>}
            </div>
            <div>
              <label htmlFor="attendees" className="block text-sm font-medium text-gray-300 mb-1">Número de Asistentes</label>
              <input
                id="attendees"
                type="number"
                min="0"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                required
                className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${formErrors.attendees ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-indigo-500'}`}
              />
              {formErrors.attendees && <p className="text-red-500 text-sm mt-1">{formErrors.attendees}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">Fecha de Inicio</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">Hora de Inicio</label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">Fecha de Término</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">Hora de Término</label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
