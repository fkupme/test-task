// Generic lightweight colored logger with domain + scope chips.
// Usage:
//   import { createLogger } from '~/utils/logger';
//   const priceLogger = createLogger('Price');
//   const { log: priceLog, warn: priceWarn, error: priceError } = priceLogger;
//   priceLog('Tab','init', { id });
// Domains are rendered as first chip: [Domain][Scope] message
// Filtering plugin currently allows only [Price]* + API related logs.

export interface Logger {
  log(scope: string, message: string, ...rest: any[]): void;
  warn(scope: string, message: string, ...rest: any[]): void;
  error(scope: string, message: string, ...rest: any[]): void;
}

interface StyleMap { [k: string]: string }

export interface LoggerOptions {
  domainColor?: string;        // background color for domain chip
  scopeColors?: StyleMap;      // map scope -> color
  defaultScopeColor?: string;  // fallback color
}

const defaultScopeColors: StyleMap = {
  Tab: '#2ecc71',
  Tabs: '#27ae60',
  Actions: '#8e44ad',
  Card: '#e67e22',
  Store: '#3498db',
  Selection: '#16a085',
  Grid: '#9b59b6',
};

function style(color: string) {
  return `background:${color};color:#fff;padding:0 4px;border-radius:3px;`;
}

export function createLogger(domain: string, opts: LoggerOptions = {}): Logger {
  const domainChipStyle = style(opts.domainColor || '#34495e');
  const scopeColors = { ...defaultScopeColors, ...(opts.scopeColors || {}) };
  const defaultScopeColor = opts.defaultScopeColor || '#7f8c8d';

  function detectOrigin(): string | null {
    try {
      const stack = new Error().stack || '';
      // Split, skip first line (Error)
      const lines = stack.split(/\n+/).slice(1);
      for (const l of lines) {
        if (/logger\.ts/.test(l)) continue; // skip self
        const m = l.match(/\/?(components|stores|composables)\/(.+?)(?:\.vue|\.ts)/);
        if (m) {
          const kind = m[1];
            let raw = m[2];
          // strip subdirs if any
          raw = raw.split('/').pop() || raw;
          // normalize composable useXxx
          if (kind === 'composables') return 'comp:' + raw;
          if (kind === 'components') return 'cmp:' + raw;
          if (kind === 'stores') return 'store:' + raw;
          return raw;
        }
      }
    } catch {}
    return null;
  }

  function scopeStyle(scope: string) {
    return style(scopeColors[scope] || defaultScopeColor);
  }

  function base(kind: 'log' | 'warn' | 'error', scope: string, message: string, rest: any[]) {
    if (typeof window === 'undefined') return; // client only
    const origin = detectOrigin();
    const hasOrigin = !!origin;
    const parts = hasOrigin
      ? `%c[${domain}]%c[${scope}]%c[${origin}]%c ${message}`
      : `%c[${domain}]%c[${scope}]%c ${message}`;
    const textStyle = kind === 'warn'
      ? 'color:#c0392b;font-weight:600;'
      : kind === 'error'
        ? 'color:#e74c3c;font-weight:700;'
        : 'color:#333;font-weight:500;';
    const originStyle = 'background:#95a5a6;color:#fff;padding:0 4px;border-radius:3px;';
    const args: any[] = hasOrigin
      ? [parts, domainChipStyle, scopeStyle(scope), originStyle, textStyle]
      : [parts, domainChipStyle, scopeStyle(scope), textStyle];
    const c: any = console[kind];
    if (rest.length === 1 && typeof rest[0] === 'object') {
      c.apply(console, [...args, rest[0]]);
    } else if (rest.length) {
      c.apply(console, [...args, ...rest]);
    } else {
      c.apply(console, args);
    }
  }

  return {
    log(scope: string, message: string, ...rest: any[]) { base('log', scope, message, rest); },
    warn(scope: string, message: string, ...rest: any[]) { base('warn', scope, message, rest); },
    error(scope: string, message: string, ...rest: any[]) { base('error', scope, message, rest); },
  };
}

// Convenience: ready price logger export for existing domain usage (optional import path migration)
export const priceLogger = createLogger('Price');
// Domain loggers for partner settings & cancellation rules
export const cancellationLogger = createLogger('Cancellation', { domainColor: '#8e44ad', scopeColors: { Init: '#9b59b6', Fetch: '#2980b9', Group: '#16a085', UI: '#e67e22', Actions: '#8e44ad', Error: '#c0392b' } });
export const partnerSettingsLogger = createLogger('PartnerSettings', { domainColor: '#2c3e50', scopeColors: { Init: '#34495e', Tabs: '#27ae60', Fetch: '#2980b9', Actions: '#8e44ad', Error: '#c0392b' } });
// Bases domain logger to trace fetching & store mutation
export const basesLogger = createLogger('Bases', { domainColor: '#1abc9c', scopeColors: { Fetch: '#16a085', Store: '#27ae60', Error: '#c0392b' } });
// BookingRules domain logger for booking rules management
export const bookingRulesLogger = createLogger('BookingRules', { 
  domainColor: '#e74c3c', 
  scopeColors: { 
    Init: '#c0392b',
    Tab: '#e67e22', 
    Tabs: '#f39c12',
    Store: '#3498db',
    Panel: '#9b59b6',
    Draft: '#16a085',
    Actions: '#8e44ad',
    Fetch: '#2980b9',
    Error: '#c0392b'
  } 
});
// Avoid destructuring export (caused redeclare in some HMR cycles)
export const priceLog: Logger['log'] = (scope, message, ...rest) => priceLogger.log(scope, message, ...rest);
export const priceWarn: Logger['warn'] = (scope, message, ...rest) => priceLogger.warn(scope, message, ...rest);
export const priceError: Logger['error'] = (scope, message, ...rest) => priceLogger.error(scope, message, ...rest);

export const bookingRulesLog: Logger['log'] = (scope, message, ...rest) => bookingRulesLogger.log(scope, message, ...rest);
export const bookingRulesWarn: Logger['warn'] = (scope, message, ...rest) => bookingRulesLogger.warn(scope, message, ...rest);
export const bookingRulesError: Logger['error'] = (scope, message, ...rest) => bookingRulesLogger.error(scope, message, ...rest);
