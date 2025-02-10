import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

import './ErrorPage.css';

const ErrorPage: React.FC = () => {
  return (
    <div className="content">
      <h1 className="heading">Hoppla, da ist etwas schiefgelaufen!</h1>
      <i className="bi bi-emoji-dizzy error-icon"></i>
      <p>
        Bitte überprüfen Sie, ob Sie die richtige Adresse eingegeben haben oder versuchen Sie es später erneut.
      </p>
    </div>
  );
};

export default ErrorPage;
