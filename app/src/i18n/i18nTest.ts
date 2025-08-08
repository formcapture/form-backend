import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translation from './translations.ts';

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(initReactI18next)
  .init({
    lng: 'de',
    fallbackLng: 'de',
    resources: {
      de: translation.de,
    },
    interpolation: { escapeValue: false },
    debug: false,
  });

export default i18n;
