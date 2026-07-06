import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#FFF8EF',
          fontFamily: 'sans-serif',
        }}>
          <h2 style={{ color: '#B45309', marginBottom: '1rem' }}>Something went wrong</h2>
          <pre style={{
            background: '#FEF3C7',
            padding: '1rem',
            borderRadius: '0.5rem',
            maxWidth: '600px',
            overflow: 'auto',
            fontSize: '0.8rem',
            color: '#92400E',
          }}>
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.history.back(); }}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              background: '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
