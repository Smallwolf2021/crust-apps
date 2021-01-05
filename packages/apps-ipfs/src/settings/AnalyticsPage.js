// [object Object]
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { withTranslation } from 'react-i18next';
import Title from './Title';
import Box from '../components/box/Box';
import AnalyticsToggle from '../components/analytics-toggle/AnalyticsToggle';

export const AnalyticsPage = ({ t }) => (
  <div className='mw9 center'
    data-id='AnalyticsPage'>

    <Box>
      <Title>{t('analytics')}</Title>
      <AnalyticsToggle open
        t={t} />
    </Box>
  </div>
);

export default withTranslation('settings')(AnalyticsPage);
