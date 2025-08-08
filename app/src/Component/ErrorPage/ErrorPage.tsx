import React, { JSX, useMemo } from 'react';

import _isNil from 'lodash/isNil';

import { useTranslation } from 'react-i18next';

import 'bootstrap-icons/font/bootstrap-icons.css';
import './ErrorPage.css';

export interface ErrorPageProps {
  errorInfo?: any;
  statusCode?: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorInfo,
  statusCode = 401
}: ErrorPageProps): JSX.Element => {

  const { t } = useTranslation();

  const view = new URLSearchParams(window.location.search).get('view');
  const formId = new URLSearchParams(window.location.search).get('formId');

  const errorMessage = useMemo(() => {
    if (!_isNil(view) && !_isNil(formId)) {
      return t('ErrorPage.checkUrlMsg');
    }
    if (_isNil(view) && _isNil(formId)) {
      return t('ErrorPage.checkParametersMsg');
    }
    if (_isNil(formId) ) {
      return t('ErrorCodes.FORM_ID_MISSING');
    }
    if (_isNil(view)) {
      return t('ErrorPage.checkViewParameterMsg');
    }
    return t('ErrorPage.checkUrlMsg');
  }, [formId, t, view]);

  const errorComponent = useMemo(() => {
    if (_isNil(statusCode)) {
      return <></>;
    }
    if (errorInfo && errorInfo.errorCode === 'FORM_CONFIG_NOT_FOUND' && !_isNil(formId)) {
      return t('ErrorCodes.FORM_CONFIG_NOT_FOUND', { formId } );
    }
    if (!_isNil(view) && statusCode === 200 && !['item', 'table'].includes(view)) {
      return (
        <p>
          t('ErrorPage.viewNotSupportedMsg', { view })
        </p>
      );
    }
    return (
      <p>
        {errorMessage}
      </p>
    );
  }, [errorInfo, errorMessage, formId, statusCode, t, view]);

  return (
    <div className="content">
      <h1 className="heading">{t('ErrorPage.headingText')}</h1>
      <i className="bi bi-emoji-dizzy error-icon"></i>
      {
        errorComponent
      }
    </div>

  );
};

export default ErrorPage;
