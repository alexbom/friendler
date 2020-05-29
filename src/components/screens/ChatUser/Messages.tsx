import React, {memo, useCallback, useContext, useEffect, useState} from 'react';
import * as RX from 'reactxp';

import {aChat, aScreen} from '../../../actions';
import {dispatch} from '../../../config/store';
import {CHAT_MESSAGES_OFFSET} from '../../../config/constants';
import {ChatMessageProps} from '../../../config/types';
import {ChatUserMessagesProps} from './types';
import {sFormat, sUser, sWebSocket} from '../../../services';
import {Button, H1, Loader} from '../../common';
import {ChatMessage} from '../../chat';
import * as styles from '../../../styles';
import * as css from '../../chat/css';
import {NavContext} from '../../contexts';

const _ChatUserMessages: React.FC<ChatUserMessagesProps> = (
  {
    rScreen,
    rUser,
    rChat,
    rProfile,
    isFocused
  }) => {

  const [showMoreBtn, setShowMoreBtn] = useState(true);
  const navigate = useContext(NavContext);

  const {userId} = rScreen;
  const {sid} = rUser;

  const getData = useCallback(() => {
    if (!userId || !isFocused) {
      return;
    }

    dispatch(aScreen.setLoading('ChatMessages'));
    sWebSocket.getUserMessages(sid, userId, 0, navigate)
      .then((messages: ChatMessageProps[]) => {
        dispatch(aChat.setChat({messages, page: 0}));
        dispatch(aScreen.setLoading('ChatMessages', false));
      });
  }, [userId, isFocused]);

  useEffect(getData, []);
  useEffect(getData, [userId]);

  const renderMessages = useCallback(() => {
    let prevDate;

    return rChat.messages.map((
      props: ChatMessageProps,
      index: number
    ) => {
      if (!rProfile.id) {
        return null;
      }

      const isMine = props.sender && props.sender.id === rUser.id;
      props.sender = isMine ? sUser.reducerToUserMessageProps(rUser) :
        sUser.reducerToUserMessageProps(rProfile);
      props.recipient = isMine ? sUser.reducerToUserMessageProps(rProfile) :
        sUser.reducerToUserMessageProps(rUser);

      const date = props.createdAt ? props.createdAt.split('T')[0] : null;
      const isNewDate = prevDate !== date;
      prevDate = date;

      return (
        <RX.View key={index}>
          {isNewDate && (
            <H1 style={styles.common.title} type='separator'>
              <RX.Text style={css.date} selectable>
                {sFormat.date(props.createdAt, false)}
              </RX.Text>
            </H1>
          )}
          <ChatMessage
            {...props}
            rScreen={rScreen}
            rUser={rUser}
            rChat={rChat}
          />
        </RX.View>
      );
    });
  }, [rChat.messages, rProfile]);

  const onPressMoreBtn = useCallback(() => {
    const nextPage = rChat.page + 1;
    const offset = nextPage * CHAT_MESSAGES_OFFSET;

    sWebSocket.getUserMessages(sid, userId, offset, navigate).then(
      (messages: ChatMessageProps[]) => {
        if (messages.length) {
          dispatch(aChat.setChat({
            page: nextPage,
            messages: [...rChat.messages, ...messages]
          }));

          if (messages.length < CHAT_MESSAGES_OFFSET) {
            setShowMoreBtn(false);
          }
        } else {
          setShowMoreBtn(false);
        }
      }
    );
  }, [userId, rChat.page]);

  return (
    <Loader
      style={{minHeight: 230}}
      isLoading={rScreen.loaders.includes('ChatMessages')}
    >
      <RX.View style={[styles.grid.content(), {alignSelf: 'center'}]}>
        {renderMessages()}
      </RX.View>
      {showMoreBtn && rChat.messages.length >= CHAT_MESSAGES_OFFSET && (
        <RX.View style={css.moreBtnContainer}>
          <Button
            type='primaryOutline'
            onPress={onPressMoreBtn}
          >
            Предыдущие сообщения
          </Button>
        </RX.View>
      )}
    </Loader>
  );

};

export const ChatUserMessages = memo(_ChatUserMessages);
