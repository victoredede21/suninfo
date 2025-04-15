import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketHookOptions {
  onOpen?: (event: WebSocketEventMap['open']) => void;
  onMessage?: (event: WebSocketEventMap['message']) => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
  reconnectOnClose?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketHookResult {
  sendMessage: (data: string | object) => void;
  readyState: number;
  lastMessage: MessageEvent | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(url: string, options: WebSocketHookOptions = {}): WebSocketHookResult {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectOnClose = true,
    reconnectInterval = 1000, // Faster reconnection
    maxReconnectAttempts = 20 // More reconnection attempts
  } = options;

  const socket = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<number | null>(null);
  
  const [readyState, setReadyState] = useState<number>(-1);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);

  const connect = useCallback(() => {
    if (socket.current?.readyState === WebSocket.OPEN) return;

    // Create a new WebSocket connection
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Use the provided URL or default to /ws on the current host
      const wsUrl = url.startsWith('ws') ? url : `${protocol}//${window.location.host}${url}`;
      
      console.log('Connecting to WebSocket URL:', wsUrl);
      socket.current = new WebSocket(wsUrl);
      
      socket.current.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        reconnectAttempts.current = 0;
        if (onOpen) onOpen(event);
      };
      
      socket.current.onmessage = (event) => {
        setLastMessage(event);
        if (onMessage) onMessage(event);
      };
      
      socket.current.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        if (onClose) onClose(event);
        
        // Handle reconnect logic
        if (reconnectOnClose && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectTimeoutId.current = window.setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
      
      socket.current.onerror = (event) => {
        if (onError) onError(event);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [url, onOpen, onMessage, onClose, onError, reconnectOnClose, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
    
    if (socket.current) {
      if (socket.current.readyState === WebSocket.OPEN || socket.current.readyState === WebSocket.CONNECTING) {
        socket.current.close();
      }
      socket.current = null;
    }
  }, []);

  const sendMessage = useCallback((data: string | object) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socket.current.send(message);
      return true;
    }
    return false;
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update readyState when socket ref changes
  useEffect(() => {
    if (socket.current) {
      setReadyState(socket.current.readyState);
    }
  }, [socket.current]);

  return {
    sendMessage,
    readyState,
    lastMessage,
    connect,
    disconnect
  };
}
