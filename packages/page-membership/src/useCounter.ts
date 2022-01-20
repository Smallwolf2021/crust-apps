// Copyright 2017-2022 @polkadot/app-democracy authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Hash } from '@polkadot/types/interfaces';

import { createNamedHook, useApi, useCall } from '@polkadot/react-hooks';

const transformCounter = {
  transform: (proposals: Hash[]) => proposals.length
};

function useCounterImpl (): number {
  const { api, isApiReady } = useApi();
  const counter = useCall<number>(isApiReady && api.query.membership?.proposals, undefined, transformCounter) || 0;

  return counter;
}

export default createNamedHook('useCounter', useCounterImpl);
