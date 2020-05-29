import React, {memo, useCallback, useContext, useEffect} from 'react';
//import * as Raven from 'raven-js';

import {aChat} from '../../../actions';
import {dispatch} from '../../../config/store';
import {WSReadyState} from '../../../config/types';
import {WebSocketContainerProps} from './types';
import {usePrevious} from '../../../hooks';
import {NavContext, WSContext} from '../../contexts';
import {sWebSocket} from '../../../services';

let ws: WebSocket;
let unreadInterval: number;

const _WebSocketContainer: React.FC<WebSocketContainerProps> = (
  {
    sid,
    userId,
    blacklisted,
    children
  }) => {

  const navigate = useContext(NavContext);
  const prevSid = usePrevious(sid);

  useEffect(() => {
    openConnection();

    return () => {
      closeConnection();
    };
  }, []);

  useEffect(() => {
    if (sid && prevSid && sid !== prevSid) {
      closeConnection();
      openConnection();
    } else if (!sid) {
      closeConnection();
    }
  }, [sid]);

  const clearUnreadInterval = useCallback(() => {
    if (unreadInterval) {
      clearInterval(unreadInterval);
    }
  }, [sid]);

  const closeConnection = useCallback(() => {
    clearUnreadInterval();

    if (ws && ws.readyState === WSReadyState.open) {
      ws.close();
    }
  }, [sid]);

  const onMessage = useCallback(e => {
    sWebSocket.onMessage(e.data, userId, blacklisted);
  }, [userId, blacklisted]);

  const onError = useCallback(e => {
    console.error(e);
    /*Raven.captureException(new Error('WebSocket Error'), {
      tags: {userId: userId as any}
    });*/
  }, [sid]);

  const onOpen = useCallback(() => {
    unreadInterval = window.setInterval(() => {
      dispatch(aChat.getUnread(sid, navigate));
    }, 1000 * 10);
  }, [sid]);

  const getWS = useCallback((): WebSocket => ws, [sid]);

  const openConnection = useCallback(() => {
    if (!sid) {
      return;
    }

    const isOpened = ws ? ws.readyState === WSReadyState.open : false;
    if (isOpened) {
      return;
    }

    ws = sWebSocket.connection({
      sid,
      onmessage: onMessage,
      onopen: onOpen,
      onerror: onError,
      onclose: closeConnection,
    });
  }, [sid]);

  return (
    <WSContext.Provider value={getWS}>
      {children}
    </WSContext.Provider>
  );

};

export const WebSocketContainer = memo(_WebSocketContainer);
