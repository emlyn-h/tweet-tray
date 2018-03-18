import React, { Component, } from 'react';
import PropTypes from 'prop-types';
import Styled from 'styled-components';
import { connect, } from 'react-redux';

import Header from './Header';
import InnerContent from './InnerContent';
import UserProfilePhoto from './UserProfilePhoto';
import IconButton from './IconButton';
import StatusInput from './StatusInput';
import MediaListView from './MediaListView';
import RoundedButton from './RoundedButton';
import Footer from './Footer';

import * as constants from '../constants';

import NotificationManager from '../utils/NotificationManager';
import ImageDialog from '../utils/ImageDialog';

import Utilities from '../containers/Utilities';

const notificationManager = new NotificationManager();

const ComposerStyle = Styled.section`
  overflow: hidden;
  user-select: none;
  width: 100%;
  height: 100%;
  background-color: ${(props) => {
    return props.theme === 'day' ? constants.WHITE : constants.DARK_MODE_BACKGROUND;
  }};
  position: relative;
`;

class Composer extends Component {
  static propTypes = {
    theme: PropTypes.string.isRequired,
    weightedStatus: PropTypes.object,
    statusImage: PropTypes.object,
    profileImageURL: PropTypes.string,
    profileLinkColor: PropTypes.string.isRequired,
    accessTokenPair: PropTypes.object,
    onUpdateWeightedStatus: PropTypes.func.isRequired,
    onSetStatusImage: PropTypes.func.isRequired,
    renderProcess: PropTypes.object.isRequired,
    shell: PropTypes.object.isRequired,
    localeManager: PropTypes.object.isRequired,
  };

  static defaultProps = {
    weightedStatus: null,
    statusImage: null,
    profileImageURL: null,
    accessTokenPair: null,
  };

  static contextTypes = {
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.addImage = this.addImage.bind(this);
    this.removeImage = this.removeImage.bind(this);
    this.postStatus = this.postStatus.bind(this);
    this.goToSettings = this.goToSettings.bind(this);
  }

  componentDidMount() {
    const {
      renderProcess,
      shell,
      localeManager,
    } = this.props;

    renderProcess.on('postStatusError', () => {
      notificationManager.send(
        localeManager.post_status_error.title,
        localeManager.post_status_error.description,
        false,
      );
    });

    renderProcess.on('postStatusComplete', (event, response) => {
      const { id_str, user, } = response; /* eslint camelcase: 0 */

      notificationManager.send(
        localeManager.post_status_success.title,
        localeManager.post_status_success.description,
        false,
        () => {
          shell.openExternal(`https://twitter.com/${user.screen_name}/status/${id_str}`);
        }
      );
    });

    renderProcess.on('send-tweet-shortcut', () => {
      this.postStatus();
    });
  }

  addImage(e) {
    const { onSetStatusImage, } = this.props;
    if (e) {
      e.preventDefault();
    }
    ImageDialog((newImage) => {
      onSetStatusImage(newImage);
    });
  }

  removeImage() {
    const { onSetStatusImage, } = this.props;
    onSetStatusImage(null);
  }

  postStatus(e) {
    const {
      renderProcess,
      accessTokenPair,
      weightedStatus,
      statusImage,
      onUpdateWeightedStatus,
      onSetStatusImage,
    } = this.props;

    if (e) {
      e.preventDefault();
    }

    const statusText = weightedStatus === null ? '' : weightedStatus.text;
    const imageData = statusImage ? statusImage.data : null;

    renderProcess.send('postStatus', {
      accessTokenPair,
      statusText,
      imageData,
    });

    onSetStatusImage(null);
    onUpdateWeightedStatus(null);
    this.forceUpdate();
  }

  goToSettings() {
    this.context.router.history.replace('/settings');
  }

  render() {
    const {
      theme,
      profileImageURL,
      profileLinkColor,
      weightedStatus,
      statusImage,
      onUpdateWeightedStatus,
      localeManager,
    } = this.props;

    const weightedStatusText = weightedStatus === null ? null : weightedStatus.text;
    const weightedTextAmount = weightedStatus !== null ? weightedStatus.permillage : null;
    const imageDataSource = statusImage !== null ? [statusImage, ] : null;

    return (
      <ComposerStyle
        theme={theme}
      >
        <Header
          theme={theme}
          title={
            localeManager.composer.title
          }
          rightView={
            <IconButton
              theme={theme}
              icon="settings"
              color={profileLinkColor}
              onClick={this.goToSettings}
            />
          }
        />
        <InnerContent
          theme={theme}
          style={{
            position: 'relative',
            top: '48px',
            left: '0px',
            minHeight: '180px',
            height: 'calc(100% - 132px)',
          }}
        >
          <UserProfilePhoto
            theme={theme}
            profilePhotoURL={profileImageURL}
            arcColor={profileLinkColor}
            weightedTextAmount={weightedTextAmount}
          />
          <StatusInput
            theme={theme}
            placeholder={localeManager.composer.placeholder}
            weightedStatusText={weightedStatusText}
            updateWeightedStatus={onUpdateWeightedStatus}
          />
          <MediaListView
            dataSource={imageDataSource}
            onRemoveImage={this.removeImage}
          />
        </InnerContent>
        <Footer
          theme={theme}
          leftView={
            <IconButton
              theme={theme}
              disabled={imageDataSource !== null}
              icon="photo"
              color={profileLinkColor}
              onClick={this.addImage}
            />
          }
          rightView={
            <RoundedButton
              theme={theme}
              disabled={weightedStatus === null && imageDataSource === null}
              title={localeManager.composer.tweet_button}
              color={profileLinkColor}
              fullWidth={false}
              type="submit"
              onClick={this.postStatus}
            />
            }
        />
      </ComposerStyle>
    );
  }
}

const mapStateToProps = (store) => {
  return {
    theme: store.theme,
  };
};

export default connect(mapStateToProps, null)(Utilities(Composer));
