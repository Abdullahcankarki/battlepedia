import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Fängt Fehler beim Rendern ab. Statt einer weißen Seite sieht der Nutzer eine Meldung
 * und kann die Seite neu laden. So führt keine Exception zum Absturz der Oberfläche.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hier könnte der Fehler an ein Monitoring geschickt werden. In der Entwicklung reicht die Konsole.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please reload the page.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
