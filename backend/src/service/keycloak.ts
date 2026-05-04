import { Request, Response } from 'express';

import { PublicKeycloakConfig } from '../types/keycloakConfig';
import { Opts } from '../types/opts';

class KeycloakService {
  #opts: Opts;

  constructor(opts: Opts) {
    this.#opts = opts;
  }

  async getPublicKeycloakConfig(req: Request, res: Response) {
    const config: PublicKeycloakConfig = {
      url: this.#opts.KC_PUBLIC_URL,
      realm: this.#opts.KC_REALM,
      clientId: this.#opts.KC_CLIENT_APP_ID
    };

    return res.json(config);
  }
}

export default KeycloakService;
