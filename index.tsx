
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
  console.log("✅ App montado no DOM com sucesso.");
} else {
  console.error("❌ Erro: Elemento #root não encontrado.");
}
