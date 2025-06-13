import { NextFunction, Response } from 'express';

import { GenericRequestError } from '../errors/GenericRequestError';
import { decodeToken, getRolesFromToken, getTokenFromHeader } from '../keycloak/keycloak';
import { setupLogger } from '../logger';
import FormConfigProcessor from '../processor/formConfig';
import { FormConfig } from '../types/formConfig';
import { FormConfigRequest } from '../types/formConfigRequest';
import { Opts } from '../types/opts';

export type Permission = 'readForm' | 'writeForm' | 'tableView' | 'itemView';
export interface AuthorizationOpts {
  opts: Opts;
  requiredPermissions: Permission[];
}
export interface UserRolesLoaderOpts {
  opts: Opts;
}

const checkPermission = (formConfig: FormConfig, permission: Permission, userRoles: string[]) => {
  switch (permission) {
    case 'readForm':
      return FormConfigProcessor.allowsReadForm(formConfig, userRoles);
    case 'writeForm':
      return FormConfigProcessor.allowsWriteForm(formConfig, userRoles);
    case 'tableView':
      return FormConfigProcessor.allowsTableView(formConfig);
    case 'itemView':
      return FormConfigProcessor.allowsItemView(formConfig);
    default:
      return false;
  }
};

/**
 * Middlerware for injecting the user roles into the request object
 * after verifying the token.
 */
export const userRolesLoader = (userRolesLoaderOpts: UserRolesLoaderOpts) => {

  const logger = setupLogger({ label: 'userRolesLoader' });

  return (req: FormConfigRequest, res: Response, next: NextFunction) => {
    try {
      const token = getTokenFromHeader(req.headers.authorization);
      const decodedToken = decodeToken(token, userRolesLoaderOpts.opts);
      const userRoles = getRolesFromToken(decodedToken, userRolesLoaderOpts.opts);
      req.userRoles = userRoles ?? [];
      next();
    } catch (err) {
      logger.debug('User roles loading failed', err);
      next(err);
    }
  };
};

/**
 * Middleware for checking if the user has the required permissions.
 */
export const authorization = (authorizationOpts: AuthorizationOpts) => {

  const logger = setupLogger({ label: 'authorization' });

  return (req: FormConfigRequest, res: Response, next: NextFunction) => {
    try {
      const userRoles = req.userRoles;
      const hasPermission = authorizationOpts.requiredPermissions
        .every((permission) => checkPermission(req.formConfig, permission, userRoles));
      if (hasPermission) {
        return next();
      }
      throw new GenericRequestError(`Insufficient permissions for form ${req.params.formId}`);
    } catch (err) {
      logger.debug('Authorization failed:', err);
      next(err);
    }
  };
};
