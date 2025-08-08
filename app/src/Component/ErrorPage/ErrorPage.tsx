import React, { JSX, useMemo } from 'react';

import _isNil from 'lodash/isNil';

import 'bootstrap-icons/font/bootstrap-icons.css';

import './ErrorPage.css';
import { errorCodeMap } from './errors.tsx';

export interface ErrorPageProps {
  errorInfo?: any;
  statusCode?: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorInfo,
  statusCode = 401
}: ErrorPageProps): JSX.Element => {

  const view = new URLSearchParams(window.location.search).get('view');
  const formId = new URLSearchParams(window.location.search).get('formId');

  const errorMessage = useMemo(() => {
    if (!_isNil(view) && !_isNil(formId)) {
      return 'Bitte überprüfen Sie, ob Sie die richtige Adresse eingegeben haben oder versuchen Sie es später erneut.';
    }
    if (_isNil(view) && _isNil(formId)) {
      return 'Bitte geben Sie die `formId` und `view` Parameter in der URL an.';
    }
    if (_isNil(formId) ) {
      return 'Bitte prüfen Sie den `formId` Parameter in der URL.';
    }
    if (_isNil(view)) {
      return 'Bitte prüfen Sie den `view` Parameter in der URL.';
    }
    return 'Bitte überprüfen Sie die URL oder versuchen Sie es später erneut.';
  }, [formId, view]);

  const errorComponent = useMemo(() => {
    if (_isNil(statusCode)) {
      return <></>;
    }
    if (errorInfo && errorInfo.errorCode === 'FORM_CONFIG_NOT_FOUND' && !_isNil(formId)) {
      return (
        errorCodeMap.FORM_CONFIG_NOT_FOUND(formId)
      );
    }
    if (!_isNil(view) && statusCode === 200 && !['item', 'table'].includes(view)) {
      return (
        <p>
          Die angeforderte Ansicht <strong>{view}</strong> ist nicht verfügbar.
          Bitte verwenden Sie entweder <strong>item</strong> oder <strong>table</strong> als View.
        </p>
      );
    }
    return (
      <p>
        {errorMessage}
      </p>
    );
  }, [errorInfo, errorMessage, formId, statusCode, view]);

  return (
    <div className="content">
      <h1 className="heading">Hoppla, da ist etwas schiefgelaufen!</h1>
      <i className="bi bi-emoji-dizzy error-icon"></i>
      {
        errorComponent
      }
    </div>

  );
};

export default ErrorPage;
