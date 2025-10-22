import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-indigo-500/30">
      <div className="container mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          Planificador de Eventos IA
        </h1>
        <p className="text-gray-400 mt-1">
          Gestiona tus presupuestos, costos y tareas con la ayuda de la IA.
        </p>
      </div>
    </header>
  );
};

export default Header;
