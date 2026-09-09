import { config } from '@shared/config';

interface SSECallbacks {
  onNotification?: (data: unknown) => void;
  onCounterUpdate?: (data: { unreadCount: number }) => void;
  onConnection?: () => void;
  onError?: (error: Event) => void;
}

class SSEClient {
  private eventSource: EventSource | null = null;
  private callbacks: SSECallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('[SSE] No access token, skipping connection');
      return;
    }

    if (this.eventSource) {
      this.disconnect();
    }

    const url = `${config.sseUrl}?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected');
      this.reconnectAttempts = 0;
      this.callbacks.onConnection?.();
    };

    this.eventSource.addEventListener('connected', () => {
      console.log('[SSE] Connection confirmed by server');
    });

    this.eventSource.addEventListener('notification', (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.callbacks.onNotification?.(payload);
      } catch (err) {
        console.error('[SSE] Failed to parse notification:', err);
      }
    });

    this.eventSource.addEventListener('counter_update', (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.callbacks.onCounterUpdate?.(payload);
      } catch (err) {
        console.error('[SSE] Failed to parse counter update:', err);
      }
    });

    this.eventSource.onerror = (error) => {
      this.callbacks.onError?.(error);
      // ponytail: при CONNECTING EventSource переподключается сам. Свой reconnect поверх него
      // открывал вторую сессию, а сервер держит одну на юзера и рвал предыдущую — цикл без конца.
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.handleReconnect();
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[SSE] Disconnected');
    }
  }

  on<T extends keyof SSECallbacks>(event: T, callback: SSECallbacks[T]) {
    this.callbacks[event] = callback;
  }

  off(event: keyof SSECallbacks) {
    delete this.callbacks[event];
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

export const sseClient = new SSEClient();
