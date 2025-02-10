import { createLogger, format, transports } from 'winston';
const { combine, label, timestamp } = format;

export const setupLogger = (opts: {label: string}) => {
  const level = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  const formBackendFormat = format.printf((fOpts) => {
    return `${fOpts.timestamp} [${fOpts.label}] ${fOpts.level.toLocaleUpperCase()}: ${fOpts.message}`;
  });

  const formatOpts = combine(
    timestamp(),
    label({ label: opts.label }),
    formBackendFormat
  );

  const logger = createLogger({
    level,
    format: formatOpts,
    // When not in production, we need to write to console instead stdout
    // in order to see the logs in the attached process (e.g. in VSCode).
    transports: [new transports.Console({forceConsole: !isProduction})]
  });

  return logger;
};
