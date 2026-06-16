import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback';
import { ThemeContext } from './hooks/theme.context';

import "./global.css"

function Root() {
    return (
        <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <App />
            </ErrorBoundary>
        </ThemeContext.Provider>
    );
}

createRoot(document.getElementById('root')!).render(<Root />)
