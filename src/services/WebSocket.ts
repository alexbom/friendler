import dayjs from 'dayjs';

import {aChat, aProfile, aUser} from '../actions';
import {HOST} from '../config/constants';
import {
  ChatMessageProps, ConnectionProps, DialogProps, Navigate,
  ReducerScreenProps, ReducerUserProps, WSMessageProps,
  WSReadyState
} from '../config/types';
import {dispatch} from '../config/store';
import {WebSocketRef} from '../components/chat/WebSocketContainer/types';

const get = require('lodash/get');

export const connection = (props: ConnectionProps): WebSocket => {
  if (!props.sid) {
    return null;
  }

  const host = HOST.split('//');
  const ws = new WebSocket(`wss://${host[1]}wss?sid=${props.sid}`);

  ws.onopen = props.onopen;
  ws.onmessage = props.onmessage;
  ws.onerror = props.onerror;
  ws.onclose = props.onclose;

  return ws;
};

export const readMessages = (
  messages: ChatMessageProps[],
  userId?: number,
  readAt?: string
): ChatMessageProps[] => messages.map(m => {
  const senderId = get(m, 'sender.id');

  if (!m.readAt && (!userId || userId === senderId)) {
    m.readAt = readAt || new Date().getTime().toString();
  }

  return m;
});

export const readDialogs = (
  dialogs: DialogProps[],
  userId: number,
  readAt?: string
): DialogProps[] => dialogs.map(d => {
  if (!d.lastMessage.readAt && d.user.id && d.user.id === userId) {
    d.lastMessage.readAt = readAt || new Date().getTime().toString();
  }

  return d;
});

export const clearProposalMessages = (
  messages: ChatMessageProps[]
): ChatMessageProps[] => messages.map(
  m => m.type !== 'phoneExchangeProposal' ? m :
    {...m, options: {isFinished: true}});

export const phoneExchangeAccept = (
  props: ChatMessageProps,
  rScreen: ReducerScreenProps,
  rUser: ReducerUserProps,
  ws: WebSocketRef
) => {
  const wsMessage: WSMessageProps = {
    type: 'phoneExchangeAccept',
    sender: rUser.id,
    recipient: rScreen.userId,
    createdAt: dayjs(new Date()).format(),
    options: {requestId: props.options.requestId}
  };

  const listMessage: ChatMessageProps = {
    type: 'phoneExchangeAccept',
    createdAt: dayjs(new Date()).format(),
    sender: props.recipient,
    recipient: props.sender,
    readAt: null
  };

  send(ws, wsMessage);
  dispatch(aChat.clearProposalMessages());
  dispatch(aChat.addMessage(listMessage));
};

export const phoneExchangeDecline = (
  props: ChatMessageProps,
  rScreen: ReducerScreenProps,
  rUser: ReducerUserProps,
  ws: WebSocketRef
) => {
  const wsMessage: WSMessageProps = {
    type: 'phoneExchangeDecline',
    sender: rUser.id,
    recipient: rScreen.userId,
    createdAt: dayjs(new Date()).format()
  };

  const listMessage: ChatMessageProps = {
    type: 'phoneExchangeDecline',
    createdAt: dayjs(new Date()).format(),
    sender: props.recipient,
    recipient: props.sender,
    readAt: null
  };

  send(ws, wsMessage);
  dispatch(aChat.clearProposalMessages());
  dispatch(aChat.addMessage(listMessage));
};

export const onMessage = (
  message: string,
  userId: number,
  blacklisted: number[]
) => {
  const data = JSON.parse(message);

  if (data.type === 'chatMessageRead') {
    if (data.userId === userId) {
      dispatch(aChat.markAsRead());
    }
    return;
  } else if (data.type === 'isOnline') {
    dispatch(aProfile.setProfile({isOnline: data.online[userId]}));
    return;
  }

  const blacklistIndex = blacklisted.indexOf(data.sender.id);
  switch (data.type) {
    case 'blacklistAdd':
      if (blacklistIndex === -1) {
        blacklisted.push(data.sender.id);
        dispatch(aUser.setUser({blacklisted}));
      }
      break;
    case 'blacklistRemove':
      if (blacklistIndex > -1) {
        blacklisted.splice(blacklistIndex, 1);
        dispatch(aUser.setUser({blacklisted}));
      }
      break;
  }

  dispatch(aChat.addMessage(data));
};

export const messageToDialog = (message: ChatMessageProps): DialogProps => ({
  user: message.sender,
  lastMessage: message
});

export const unreadCount = (
  messages: ChatMessageProps[],
  selfId: number,
  userId?: number
): number => messages.filter(
  m => !m.readAt && (!m.recipient || m.recipient.id === selfId)
    && (!userId || m.sender.id === userId)).length;

export const send = (ws: WebSocketRef, message: WSMessageProps): boolean => {
  if (!ws()) {
    console.error('Empty WebSocket token');
    return false;
  }

  if (ws().readyState !== WSReadyState.open) {
    console.error('WebSocket state: ' + WSReadyState[ws().readyState]);
    return false;
  }

  ws().send(JSON.stringify(message));
  return true;
};

export const getUserMessages = (
  sid: string,
  userId: number,
  offset = 0,
  navigate: Navigate
): Promise<ChatMessageProps[]> =>
  new Promise(resolve => {
    dispatch(aChat.getUserMessages(
      sid, userId, offset, navigate, resolve
    ));
  });
