import { compose } from './compose';

/** Removes the integration test stack. Set INTEGRATION_KEEP_STACK=1 to inspect it after a run. */
export default async () => {
  if (process.env.INTEGRATION_KEEP_STACK) {
    return;
  }
  compose('down', '-v', '--remove-orphans');
};
