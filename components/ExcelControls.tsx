
import React, { useRef } from 'react';
import type { EventData, CostItem, Task } from '../types';
import { DownloadIcon, UploadIcon } from './icons';

declare var XLSX: any; // Use declare var for CDN scripts

interface ExcelControlsProps {
  events: EventData[];
  sharedCosts: CostItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventData[]>>;
  setSharedCosts: React.Dispatch<React.SetStateAction<CostItem[]>>;
}

const ExcelControls: React.FC<ExcelControlsProps> = ({ events, sharedCosts, setEvents, setSharedCosts }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // 1. Summary Data
    const sharedCostsTotal = sharedCosts.reduce((sum, item) => sum + item.amount, 0);
    const sharedCostPerEvent = events.length > 0 ? sharedCostsTotal / events.length : 0;
    const summaryData = events.map(event => {
        const ownCostsTotal = event.costItems.reduce((sum, item) => sum + item.amount, 0);
        const totalSpent = ownCostsTotal + sharedCostPerEvent;
        return {
            'Evento': event.name,
            'Presupuesto Total': event.totalBudget,
            'Gasto Total': totalSpent,
            'Presupuesto Disponible': event.totalBudget - totalSpent
        };
    });

    // 2. Specific Costs Data
    const specificCostsData = events.flatMap(event => 
        event.costItems.map(item => ({
            'Evento': event.name,
            'Descripción': item.description,
            'Monto': item.amount
        }))
    );

    // 3. Shared Costs Data
    const sharedCostsData = sharedCosts.map(item => ({
        'Descripción': item.description,
        'Monto': item.amount
    }));
    
    // 4. Tasks Data
    const tasksData = events.flatMap(event => 
        event.tasks.map(task => ({
            'Evento': event.name,
            'Tarea': task.description,
            'Fecha Límite': task.dueDate,
            'Estado': task.isComplete ? 'Completada' : 'Pendiente'
        }))
    );

    // 5. Create Workbook and Sheets
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsSpecific = XLSX.utils.json_to_sheet(specificCostsData);
    const wsShared = XLSX.utils.json_to_sheet(sharedCostsData);
    const wsTasks = XLSX.utils.json_to_sheet(tasksData);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsSpecific, "Costos Específicos");
    XLSX.utils.book_append_sheet(wb, wsShared, "Costos Compartidos");
    XLSX.utils.book_append_sheet(wb, wsTasks, "Tareas");
    
    // 6. Trigger Download
    XLSX.writeFile(wb, `Presupuesto_Eventos_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmation = window.confirm("¿Estás seguro de que quieres importar este archivo? Se sobrescribirán todos los datos actuales.");
    if (!confirmation) {
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });

            const newEventsData = events.map(event => ({ ...event, costItems: [], tasks: [] }));

            // Process Shared Costs
            const sharedSheet = workbook.Sheets['Costos Compartidos'];
            const newSharedCosts: CostItem[] = sharedSheet ? XLSX.utils.sheet_to_json(sharedSheet).map((row: any, index: number) => ({
                id: `shared-imported-${index}`,
                description: row['Descripción'] || 'Sin descripción',
                amount: typeof row['Monto'] === 'number' ? row['Monto'] : 0,
            })) : [];

            // Process Specific Costs
            const specificSheet = workbook.Sheets['Costos Específicos'];
            if (specificSheet) {
                const importedSpecificCosts: any[] = XLSX.utils.sheet_to_json(specificSheet);
                importedSpecificCosts.forEach((row, index) => {
                    const targetEvent = newEventsData.find(e => e.name === row['Evento']);
                    if (targetEvent) {
                        targetEvent.costItems.push({
                            id: `specific-imported-${targetEvent.id}-${index}`,
                            description: row['Descripción'] || 'Sin descripción',
                            amount: typeof row['Monto'] === 'number' ? row['Monto'] : 0,
                        });
                    }
                });
            }

            // Process Tasks
            const tasksSheet = workbook.Sheets['Tareas'];
            if (tasksSheet) {
                const importedTasks: any[] = XLSX.utils.sheet_to_json(tasksSheet);
                importedTasks.forEach((row, index) => {
                    const targetEvent = newEventsData.find(e => e.name === row['Evento']);
                    if (targetEvent) {
                        targetEvent.tasks.push({
                            id: `task-imported-${targetEvent.id}-${index}`,
                            description: row['Tarea'] || 'Sin descripción',
                            dueDate: row['Fecha Límite'] || '',
                            isComplete: row['Estado'] === 'Completada',
                        });
                    }
                });
            }

            setSharedCosts(newSharedCosts);
            setEvents(newEventsData);
            alert("¡Datos importados correctamente!");

        } catch (error) {
            console.error("Error al importar el archivo Excel:", error);
            alert(`Hubo un error al procesar el archivo. ${error instanceof Error ? error.message : "Asegúrate de que tenga el formato correcto."}`);
        } finally {
             if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-4 my-8 border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-gray-200">Sincronización con Excel</h3>
            <p className="text-sm text-gray-400">Importa o exporta el estado actual, incluyendo costos y tareas.</p>
        </div>
        <div className="flex gap-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
            <button
                onClick={handleImportClick}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
                <UploadIcon />
                Importar
            </button>
            <button
                onClick={handleExport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
                <DownloadIcon />
                Exportar
            </button>
        </div>
    </div>
  );
};

export default ExcelControls;
