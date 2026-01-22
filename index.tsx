
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Captura erros globais para evitar tela branca silenciosa no console
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Erro Crítico no App:", message, "em", source, lineno, colno);
};

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("App montado com sucesso.");
  } catch (err) {
    console.error("Falha ao renderizar o React:", err);
    container.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Erro ao carregar o aplicativo</h2>
      <p>${err instanceof Error ? err.message : 'Erro desconhecido'}</p>
      <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">Tentar Novamente</button>
    </div>`;
  }
} else {
  console.error("Elemento #root não encontrado no DOM.");
}
