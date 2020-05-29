import * as RX from 'reactxp';

export interface WebSocketContainerProps {
  sid?: string;
  userId?: number;
  blacklisted?: number[];
  children?: RX.Types.ReactNode;
}

export type WebSocketRef = () => WebSocket;
