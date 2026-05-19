// api.js — Anthropic streaming API client with AbortController
// Exposes: App.api.generateStream(systemPrompt, userPrompt, callbacks)

window.App = window.App || {};

(function() {
  const MODEL = 'claude-haiku-4-5-20251001';
  const MAX_TOKENS = 16000;

  /**
   * Streams a response from Claude.
   * callbacks: { onStart, onChunk(text, accumulated), onDone(fullText), onError(err) }
   * Returns: AbortController (caller can call .abort())
   */
  function generateStream(systemPrompt, userPrompt, callbacks) {
    const cb = callbacks || {};
    const apiKey = App.kv.get('anthropic_api_key', '');
    if (!apiKey) {
      cb.onError && cb.onError(new Error('No API key. Enter it at the top of the page.'));
      return null;
    }

    const controller = new AbortController();
    let accumulated = '';

    (async () => {
      try {
        cb.onStart && cb.onStart();
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            stream: true,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          let err = {};
          try { err = JSON.parse(errText); } catch (e) {}
          const errorMsg = (err.error && (err.error.message || err.error.type)) || errText || 'Unknown error';
          throw new Error(errorMsg + ' (HTTP ' + response.status + ')');
        }

        if (!response.body) throw new Error('Streaming not supported by this browser.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by \n\n
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const dataLines = rawEvent.split('\n').filter(l => l.startsWith('data:'));
            for (const line of dataLines) {
              const json = line.slice(5).trim();
              if (!json || json === '[DONE]') continue;
              try {
                const evt = JSON.parse(json);
                if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
                  const text = evt.delta.text || '';
                  accumulated += text;
                  cb.onChunk && cb.onChunk(text, accumulated);
                } else if (evt.type === 'error') {
                  throw new Error(evt.error && evt.error.message || 'Stream error');
                }
              } catch (parseErr) {
                // Ignore malformed events but log
                console.warn('Bad SSE event:', json);
              }
            }
          }
        }

        cb.onDone && cb.onDone(accumulated);
      } catch (err) {
        if (err.name === 'AbortError') {
          cb.onError && cb.onError(new Error('Generation cancelled.'));
        } else {
          cb.onError && cb.onError(err);
        }
      }
    })();

    return controller;
  }

  App.api = { generateStream, MODEL, MAX_TOKENS };
})();
