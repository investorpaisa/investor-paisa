// Application entry point - InvestorPaisa Platform
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './integrations/firebase'

// Create root and render app
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found');
}
