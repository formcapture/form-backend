import Keycloak from 'keycloak-js';
import {
  describe,
  it,
  expect
} from 'vitest';

import { getKeycloakInst, setKeycloakInst } from './keycloak';

describe('keycloak', () => {
  it('should get/set keycloakInst', () => {
    const keycloakInst: Keycloak = {} as Keycloak;
    setKeycloakInst(keycloakInst);
    expect(getKeycloakInst()).toBe(keycloakInst);
  });
});
