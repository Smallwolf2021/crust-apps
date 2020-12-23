// [object Object]
// SPDX-License-Identifier: Apache-2.0
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'redux-bundler-react';
import { getNavHelper } from 'internal-nav-helper';
import ReactJoyride from 'react-joyride';
import { withTranslation } from 'react-i18next';
import { normalizeFiles } from './lib/files';
// React DnD
import { DropTarget } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
// Lib
import { appTour } from './lib/tours';
import { getJoyrideLocales } from './helpers/i8n';
// Components
import ComponentLoader from './loader/ComponentLoader';
import Notify from './components/notify/Notify';
import Connected from './components/connected/Connected';
import FilesExploreForm from './files/explore-form/FilesExploreForm';

export class App extends Component {
  static propTypes = {
    doTryInitIpfs: PropTypes.func.isRequired,
    doUpdateUrl: PropTypes.func.isRequired,
    doUpdateHash: PropTypes.func.isRequired,
    doFilesWrite: PropTypes.func.isRequired,
    route: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.element
    ]).isRequired,
    routeInfo: PropTypes.object.isRequired,
    // Injected by DropTarget
    isOver: PropTypes.bool.isRequired
  }

  //
  componentDidMount () {
    this.props.doTryInitIpfs();
  }

  //
  addFiles = async (filesPromise) => {
    const { doFilesWrite, doUpdateHash, routeIfo } = this.props;
    const isFilesPage = routeInfo.pattern === '/storage/files*';
    const addAtPath = isFilesPage ? routeInfo.params.path : '/storage/';
    const files = await filesPromise;

    doFilesWrite(normalizeFiles(files), addAtPath);

    // Change to the files pages if the user is not there
    if (!isFilesPage) {
      doUpdateHash('/storage/files');
    }
  }

  handleJoyrideCb = (data) => {
    if (data.action === 'close') {
      this.props.doDisableTooltip();
    }
  }

  //
  render () {
    const { canDrop, connectDropTarget, doExploreUserProvidedPath, doFilesNavigateTo, ipfsReady, isOver, route: Page, routeInfo: { url }, showTooltip, t } = this.props;

    return connectDropTarget(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div className='sans-serif h-100'
        onClick={getNavHelper(this.props.doUpdateUrl)}>
        {/* Tinted overlay that appears when dragging and dropping an item */}
        { canDrop && isOver && <div className='w-100 h-100 top-0 left-0 absolute'
          style={{ background: 'rgba(99, 202, 210, 0.2)' }} /> }
        <div className='flex flex-row-reverse-l flex-column-reverse justify-end justify-start-l'
          style={{ minHeight: '100vh' }}>
          <div className='flex-auto-l'>
            <div className='flex items-center ph3 ph4-l'
              style={{ WebkitAppRegion: 'drag', height: 75, background: '#F0F6FA', paddingTop: '20px', paddingBottom: '15px' }}>
              <div className='joyride-app-explore'
                style={{ width: 560 }}>
                <FilesExploreForm onBrowse={doFilesNavigateTo}
                  onInspect={doExploreUserProvidedPath} />
              </div>
              <div className='dn flex-ns flex-auto items-center justify-end'>
                {/*<TourHelper />*/}
                <Connected className='joyride-app-status' />
              </div>
            </div>
            <main className='bg-white pv3 pa3'>
              { (ipfsReady || url === '/welcome' || url.startsWith('/settings'))
                ? <Page />
                : <ComponentLoader pastDelay />
              }
            </main>
          </div>

        </div>

        <ReactJoyride
          callback={this.handleJoyrideCb}
          disableOverlay
          locale={getJoyrideLocales(t)}
          run={showTooltip}
          scrollToFirstStep
          steps={appTour.getSteps({ t })}
          styles={appTour.styles}
        />

        <Notify />
      </div>
    );
  }
}

const dropTarget = {
  drop: (props, monitor, App) => {
    if (monitor.didDrop()) {
      return;
    }

    const { filesPromise } = monitor.getItem();

    App.addFiles(filesPromise);
  },
  canDrop: (props) => props.filesPathInfo ? props.filesPathInfo.isMfs : true
};

const dropCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
});

export const AppWithDropTarget = DropTarget(NativeTypes.FILE, dropTarget, dropCollect)(App);

export default connect(
  'selectRoute',
  'selectRouteInfo',
  'selectIpfsReady',
  'selectShowTooltip',
  'doFilesNavigateTo',
  'doExploreUserProvidedPath',
  'doUpdateUrl',
  'doUpdateHash',
  'doTryInitIpfs',
  'doFilesWrite',
  'doDisableTooltip',
  'selectFilesPathInfo',
  withTranslation('app')(AppWithDropTarget)
);