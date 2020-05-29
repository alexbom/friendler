import React from 'react';
import * as RX from 'reactxp';
import {connect} from 'react-redux';
import {StyleRuleSetRecursive, ViewStyleRuleSet} from 'reactxp/src/common/Types';

import {aChat, aScreen} from '../../../actions';
import {dispatch} from '../../../config/store';
import {NavContext} from '../../contexts';
import {ResponseInviteProps, routes} from '../../../config/types';
import {SidebarType} from '../../template/Sidebar/types';
import {ChatUserScreenProps, ChatUserScreenState} from './types';
import {sInvite, sScreen, sUser, sWebSocket} from '../../../services';
import {Layout, Sidebar} from '../../template';
import {ChatUserMessages} from './Messages';
import {ChatFriends} from '../../chat';
import {SidebarProfile} from '../../user';
import {ChatUserForm} from './Form';
import * as styles from '../../../styles';

class _ChatUserScreen extends RX.Component<ChatUserScreenProps, ChatUserScreenState> {

  static contextType = NavContext;
  readInterval: number;

  state: ChatUserScreenState = {
    invite: null,
  };

  componentDidMount() {
    this._readByInterval();
    this._getData();
  }

  componentDidUpdate(
    prevProps: ChatUserScreenProps,
    prevState: ChatUserScreenState
  ) {
    this._getData(prevProps);
  }

  componentWillUnmount() {
    if (this.readInterval) {
      clearInterval(this.readInterval);
    }
  }

  private _readByInterval = () => {
    this.readInterval = window.setInterval(() => {
      const {rScreen, rChat, ws} = this.props;
      const {userId, isFocused} = rScreen;

      if (!isFocused || !ws()) {
        return;
      }

      const hasUnreadDialogs = rChat.dialogs.some(
        d => d.user.id === userId && !d.lastMessage.readAt
      );
      const hasUnreadMessages = rChat.messages.some(
        d => d.sender.id === userId && !d.readAt
      );
      const hasUnread = hasUnreadDialogs || hasUnreadMessages;

      if (hasUnread) {
        const sent = sWebSocket.send(ws, {
          type: 'chatMessageRead',
          userId
        });

        if (sent) {
          dispatch(aChat.markAsRead(userId));
        }
      }
    }, 1000);
  };

  private _getData(prevProps?: ChatUserScreenProps) {
    const {rScreen} = this.props;
    const {userId, inviteId, routeId} = rScreen;

    if (!userId || routeId !== routes.ChatUserScreen) {
      return;
    }

    const isDiffUser = !prevProps || prevProps.rScreen.userId !== userId;
    if (isDiffUser) {
      sUser.getProfile(userId);
    }

    const isLoading = rScreen.loaders.includes('ChatUser');
    const isDiffInvite = !prevProps || prevProps.rScreen.inviteId !== inviteId;
    if (inviteId && isDiffInvite && !isLoading) {
      dispatch(aScreen.setLoading('ChatUser'));
      sInvite.getById(inviteId, this.context).then(
        (invite: ResponseInviteProps) => {
          dispatch(aScreen.setLoading('ChatUser', false));
          this.setState({invite});
        });
    }
  }

  render() {
    const {invite} = this.state;
    const {rScreen, rUser, rProfile, rActivity, rChat, rSearch, ws} = this.props;
    const {show, isFocused} = rScreen;

    const minFull = sScreen.type().minFull();
    const type: SidebarType = 'light';
    const contentStyle: StyleRuleSetRecursive<ViewStyleRuleSet> =
      [styles.grid.content(), {alignSelf: 'center'}];

    return (
      <Layout
        ws={ws}
        screen={this.props}
        animatedContainerStyle={styles.grid.animatedContainer}
        footerSeparator
        hasAuth
      >
        <RX.View style={styles.grid.container}>
          {minFull && (
            <Sidebar
              style={styles.sidebar.adaptive(type)}
              parent={this.props}
              type={type}
              isSticky
            >
              <SidebarProfile
                user={rProfile}
                rUser={rUser}
                rScreen={rScreen}
                rActivity={rActivity}
                isChatScreen
              />
            </Sidebar>
          )}
          <RX.ScrollView style={styles.grid.center}>
            <RX.View style={{paddingBottom: 40}}>
              <RX.View style={contentStyle}>
                <ChatUserForm
                  rScreen={rScreen}
                  rUser={rUser}
                  rProfile={rProfile}
                  invite={invite}
                  isFocused={isFocused}
                />
              </RX.View>
              <ChatUserMessages
                rScreen={rScreen}
                rUser={rUser}
                rChat={rChat}
                rProfile={rProfile}
                isFocused={isFocused}
              />
            </RX.View>
          </RX.ScrollView>
          {minFull && (
            <Sidebar
              parent={this.props}
              type={show.friends ? null : 'light'}
              isRight
              isSticky
            >
              <ChatFriends parent={this.props} sortBy={rSearch.sortBy}/>
            </Sidebar>
          )}
        </RX.View>
      </Layout>
    );
  }

}

const mapStateToProps = (state: ChatUserScreenProps) => {
  return {
    rScreen: state.rScreen,
    rNotify: state.rNotify,
    rSearch: state.rSearch,
    rActivity: state.rActivity,
    rUser: state.rUser,
    rChat: state.rChat,
    rProfile: state.rProfile
  };
};

export const ChatUserScreen = connect<ChatUserScreenProps, any>(
  mapStateToProps,
  null
)(_ChatUserScreen);
