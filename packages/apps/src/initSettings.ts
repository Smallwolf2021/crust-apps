// Copyright 2017-2020 @polkadot/apps authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import queryString from 'query-string';
import store from 'store';
import { createEndpoints } from '@polkadot/apps-config/settings';
import { registry } from '@polkadot/react-api';
import settings from '@polkadot/ui-settings';

// we split here so that both these forms are allowed
//  - http://localhost:3000/?rpc=wss://substrate-rpc.parity.io/#/explorer
//  - http://localhost:3000/#/explorer?rpc=wss://substrate-rpc.parity.io
const urlOptions = queryString.parse(location.href.split('?')[1]);
const stored = store.get('settings') as Record<string, unknown> || {};

if (Array.isArray(urlOptions.rpc)) {
  throw new Error('Invalid WS endpoint specified');
}

const fallbackUrl = createEndpoints(<T = string>(): T => ('' as unknown as T)).find(({ value }) => !!value) || { value: 'ws://127.0.0.1:9944' };
const apiUrl = urlOptions.rpc // we have a supplied value
  ? urlOptions.rpc.split('#')[0] // https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/explorer
  : [stored.apiUrl, process.env.WS_URL].includes(settings.apiUrl) // overridden, or stored
    ? settings.apiUrl // keep as-is
    : fallbackUrl.value as string; // grab the fallback

// set the default as retrieved here
settings.set({ apiUrl });

console.log('WS endpoint=', apiUrl);

try {
  const types = store.get('types') as Record<string, Record<string, string>> || {};
  const names = Object.keys(types);

  // register these anyway
  registry.register({
    Identity: {
      account_id: 'AccountId',
      pub_key: 'Vec<u8>',
      validator_pub_key: 'Vec<u8>',
      validator_account_id: 'AccountId',
      sig: 'Vec<u8>'
    },
    WorkReport: {
      pub_key: 'Vec<u8>',
      block_height: 'u64',
      block_hash: 'Vec<u8>',
      empty_root: 'MerkleRoot',
      empty_workload: 'u64',
      meaningful_workload: 'u64',
      sig: 'Vec<u8>'
    },
    StakingLedger: {
      stash: 'AccountId',
      active: 'Compact<Balance>',
      total: 'Compact<Balance>',
      valid: 'Compact<Balance>',
      unlocking: 'Vec<UnlockChunk>',
    },
    Validations: {
      total: 'Compact<Balance>',
      guarantee_fee: 'Compact<Perbill>',
      guarantors: 'Vec<AccountId>',
    },
    Nominations: {
      targets: 'Vec<AccountId>',
      total: 'Compact<Balance>',
      submitted_in: 'u32',
      suppressed: 'bool'
    },
    ReportSlot: 'u64',
    MerkleRoot: 'Vec<u8>',
  });
  if (names.length) {
    registry.register(types);
    console.log('Type registration:', names.join(', '));
  }
} catch (error) {
  console.error('Type registration failed', error);
}