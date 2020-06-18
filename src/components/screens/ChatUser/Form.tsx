import React, {memo, useCallback, useContext, useMemo, useRef, useState} from 'react';
import * as RX from 'reactxp';
import dayjs from 'dayjs';

import {aChat, aUser} from '../../../actions';
import {dispatch} from '../../../config/store';
import {EMPTY_NAME} from '../../../config/constants';
import {modals, ChatMessageProps, WSMessageProps} from '../../../config/types';
import {ChatUserFormProps} from './types';
import {TextInputCountedProps} from '../../common/TextInputCounted/types';
import * as service from '../../chat/ChatMessage/service';
import {sFormat, sUser, sModal, sWebSocket} from '../../../services';
import {WSContext} from '../../contexts';
import {B, Button, TextInputPlaceholder} from '../../common';
import {OnlineIndicator} from '../../user';
import * as styles from '../../../styles';
import * as css from '../../chat/css';

const get = require('lodash/get');

const _ChatUserForm: React.FC<ChatUserFormProps> = (
  {
    rScreen,
    rUser,
    rProfile,
    invite
  }) => {

  const ws = useContext(WSContext);
  const messageInput = useRef<TextInputCountedProps>();
  const photo = get(rProfile, 'photos[0]');

  const [message, setMessage] = useState('');
  const [textHeight, setTextHeight] = useState(0);

  const {userId} = rScreen;
  const {id: selfId, blacklist, blacklisted, isPhoneConfirmed} = rUser;

  const isBlacklisted = blacklisted ? blacklisted.includes(rProfile.id) : false;
  const inBlacklist = blacklist ? blacklist.includes(rProfile.id) : false;
  const isMessageAvailable = !isBlacklisted && !inBlacklist;

  const renderPhoto = useCallback(() =>
      sFormat.photo(photo, rProfile.gender, 'min'),
    [photo, rProfile.gender]
  );

  const onSendMessage = useCallback(() => {
    if (!message) {
      return;
    }

    const wsMessage: WSMessageProps = {
      type: 'chat',
      text: message,
      recipient: userId
    };

    const listMessage: ChatMessageProps = {
      type: 'chat',
      invite: !invite ? null : {
        id: invite.id,
        title: invite.title,
      },
      createdAt: dayjs(new Date()).format(),
      text: message,
      sender: sUser.reducerToUserMessageProps(rUser),
      recipient: sUser.reducerToUserMessageProps(rProfile),
      readAt: null
    };

    const sent = sWebSocket.send(ws, wsMessage);

    if (sent) {
      dispatch(aChat.addMessage(listMessage));
      setMessage('');
    }
  }, [ws, userId, message, invite, rUser, rProfile]);

  const onKeyPress = useCallback((e: RX.Types.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }, [onSendMessage]);

  const onPressExchangePhones = useCallback(() => {
    sModal.showConfirm('Обменяться телефонами?', {
      continueCallback: () => {
        const wsMessage: WSMessageProps = {
          type: 'phoneExchangeProposal',
          sender: selfId,
          recipient: rProfile.id,
          createdAt: dayjs(new Date()).format()
        };

        const listMessage: ChatMessageProps = {
          type: 'phoneExchangeProposal',
          createdAt: dayjs(new Date()).format(),
          sender: sUser.reducerToUserMessageProps(rUser),
          recipient: sUser.reducerToUserMessageProps(rProfile),
          readAt: null
        };

        const sent = sWebSocket.send(ws, wsMessage);

        if (sent) {
          dispatch(aChat.addMessage(listMessage));
          RX.Modal.dismiss(modals.confirm);
        }
      }
    });
  }, [ws, userId, selfId, rProfile, rProfile.id, rUser]);

  const onPressBlockUser = useCallback(() => {
    sModal.showConfirm('Запретить отправку сообщений?', {
      continueCallback: () => {
        const sent = sWebSocket.send(ws, {
          type: 'blacklistAdd',
          userId
        });

        if (sent) {
          blacklist.push(userId);
          dispatch(aUser.setUser({blacklist}));

          RX.Modal.dismiss(modals.confirm);
        }
      }
    });
  }, [ws, userId, blacklist, blacklist.length]);

  const onPressUnblockUser = useCallback(() => {
    sModal.showConfirm('Разрешить отправку сообщений?', {
      continueCallback: () => {
        const sent = sWebSocket.send(ws, {
          type: 'blacklistRemove',
          userId
        });

        if (sent) {
          const index = blacklist.findIndex(b => b === userId);
          blacklist.splice(index, 1);
          dispatch(aUser.setUser({blacklist}));

          RX.Modal.dismiss(modals.confirm);
        }
      }
    });
  }, [ws, userId, blacklist, blacklist.length]);

  return (
    <RX.View style={css.formContainer()}>
      <RX.View style={css.form}>
        <RX.Button
          style={[styles.img.thumbContainer, css.photoContainer]}
          onPress={() => service.onPressUser(ws, rProfile.id)}
        >
          <RX.Image
            style={styles.img.thumbImg}
            source={renderPhoto()}
          />
        </RX.Button>
        <RX.View style={css.body()}>
          <RX.View style={css.formHeader}>
            <RX.Button
              style={css.formNameContainer}
              onPress={() => service.onPressUser(ws, rProfile.id)}
            >
              <B style={styles.btn.simpleText} selectable={false}>
                {get(rProfile, 'name') || EMPTY_NAME}
              </B>
            </RX.Button>
          </RX.View>
        </RX.View>
        <RX.View style={css.onlineIndicator}>
          <OnlineIndicator isOnline={rProfile.isOnline} isFull isHideOffline/>
        </RX.View>
        {/*<RX.View style={css.formRight}>
          <Button
            style={css.rightTopBtn}
            img={require('Images/icons/search.png')}
          />
          <Button
            style={css.rightTopBtn}
            img={require('Images/icons/close.png')}
          />
        </RX.View>*/}
      </RX.View>
      <RX.View>
        <RX.View
          style={css.textAreaLayout}
          onLayout={e => setTextHeight(e.height)}
        >
          <RX.Text style={css.textAreaLayoutText}>{message}</RX.Text>
        </RX.View>
        <TextInputPlaceholder
          setRef={messageInput}
          style={[css.textAreaInput, {height: textHeight}]}
          value={message}
          placeholder={isMessageAvailable ? 'Сообщение...' : 'Отправка сообщений запрещена'}
          maxLength={500}
          editable={isMessageAvailable}
          autoFocus
          multiline
          onChangeText={setMessage}
          onKeyPress={onKeyPress}
        />
      </RX.View>
      <RX.View style={css.formBtnsContainer()}>
        {isMessageAvailable && (
          <RX.View style={css.formBtns}>
            <Button
              type='primary'
              onPress={onSendMessage}
            >
              Отправить
            </Button>
            {isPhoneConfirmed && rProfile.isPhoneConfirmed && (
              <Button
                style={css.formBtn}
                type='primaryOutline'
                img={require('Images/icons/phone.png')}
                sizeImg='small'
                size='small'
                noBorder
                onPress={onPressExchangePhones}
              >
                Обменяться телефонами
              </Button>
            )}
          </RX.View>
        )}
        <RX.View style={[css.formBtns, css.formBtnsRight()]}>
          {!inBlacklist ? (
            <Button
              style={css.formBtn}
              type='grayOutline'
              img={require('Images/icons/block.png')}
              sizeImg='small'
              size='small'
              noBorder
              onPress={onPressBlockUser}
            >
              В чёрный список
            </Button>
          ) : (
            <Button
              style={css.formBtn}
              type='grayOutline'
              img={require('Images/icons/block.png')}
              sizeImg='small'
              size='small'
              noBorder
              onPress={onPressUnblockUser}
            >
              Разрешить сообщения
            </Button>
          )}
          {/*<Button
            style={css.formBtn}
            type='grayOutline'
            img={require('Images/icons/help.png')}
            sizeImg='small'
            size='small'
            noBorder
          >
            Помощь
          </Button>*/}
        </RX.View>
      </RX.View>
    </RX.View>
  );

};

export const ChatUserForm = memo(_ChatUserForm);
