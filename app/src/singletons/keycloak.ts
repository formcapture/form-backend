import Keycloak from 'keycloak-js';

let keycloakInst: Keycloak | undefined = undefined;

export const getKeycloakInst = () => {
  return keycloakInst;
};

export const setKeycloakInst = (newKeycloakInst: Keycloak) => {
  keycloakInst = newKeycloakInst;
};
