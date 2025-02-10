import React from 'react';

import './LoadingPage.css';

const LoadingPage: React.FC = () => {
  return (
    <div className="d-flex justify-content-center load-content">
      <div className="spinner-border load-spinner" role="status"></div>
      <span className="sr-only load-text">Seite wird geladen…</span>
    </div>
  );
};

export default LoadingPage;
