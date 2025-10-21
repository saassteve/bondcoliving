import { useState, useEffect } from 'react';

type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseExternalScriptOptions {
  async?: boolean;
  defer?: boolean;
  attributes?: Record<string, string>;
}

export const useExternalScript = (
  src: string,
  options: UseExternalScriptOptions = {}
): ScriptStatus => {
  const [status, setStatus] = useState<ScriptStatus>(src ? 'loading' : 'idle');

  useEffect(() => {
    if (!src) {
      setStatus('idle');
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;

      if (options.defer) {
        script.defer = true;
      }

      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          script!.setAttribute(key, value);
        });
      }

      script.setAttribute('data-status', 'loading');
      document.body.appendChild(script);

      const setAttributeFromEvent = (event: Event) => {
        const target = event.target as HTMLScriptElement;
        const status = event.type === 'load' ? 'ready' : 'error';
        target.setAttribute('data-status', status);
      };

      script.addEventListener('load', setAttributeFromEvent);
      script.addEventListener('error', setAttributeFromEvent);
    } else {
      setStatus(script.getAttribute('data-status') as ScriptStatus || 'ready');
    }

    const setStateFromEvent = (event: Event) => {
      setStatus(event.type === 'load' ? 'ready' : 'error');
    };

    script.addEventListener('load', setStateFromEvent);
    script.addEventListener('error', setStateFromEvent);

    return () => {
      if (script) {
        script.removeEventListener('load', setStateFromEvent);
        script.removeEventListener('error', setStateFromEvent);
      }
    };
  }, [src, options.async, options.defer, options.attributes]);

  return status;
};
