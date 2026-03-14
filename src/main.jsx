import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { IS_CLERK_BYPASS } from './data/constants'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const rootElement = document.getElementById('root');

if (!IS_CLERK_BYPASS && !PUBLISHABLE_KEY) {
  createRoot(rootElement).render(
    <div className="fatal-error-container">
      <div className="fatal-error-card">
        <h1>Configuration Missing</h1>
        <p>The <code>VITE_CLERK_PUBLISHABLE_KEY</code> is not set in your environment variables.</p>
        <div className="fatal-error-footer">
          Please check your <code>.env</code> file or deployment configuration.
        </div>
      </div>
    </div>
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      {IS_CLERK_BYPASS ? (
        <App />
      ) : (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      )}
    </StrictMode>
  );
}
