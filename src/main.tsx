import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { db } from './db/schema';

async function initApp() {
  try {
    await db.seedDefaultCategories();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
  }
}

initApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
