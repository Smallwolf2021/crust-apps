// Copyright 2017-2021 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Card, Columar, Table } from '@polkadot/react-components';
import { useTranslation } from '@polkadot/apps/translate';
import { useApi } from '@polkadot/react-hooks';
import _ from 'lodash';
import MemberVersionDisplay from './MemberVersion';
import { PKInfo } from '../SummaryInfo';

interface Props {
    className?: string;
    address: string;
    current: number;
    pkInfos: PKInfo[];
    isLoading: boolean;
}

interface SworkerVersion {
    version: string;
    count: number
}

export interface MemberVersions {
    address: string;
    version: string;
}

interface AddressVersionState {
    owner?: string;
    memberVersions: MemberVersions[];
    memberVersionGroup?: [string, MemberVersions[]][];
    versions?: SworkerVersion[];
    versionCount?: Record<string, number>
}

export const versionsRecord: Record<string, string> = {
    '0xe6f4e6ab58d6ba4ba2f684527354156c009e4969066427ce18735422180b38f4': 'Version A',
    '0xff2c145fd797e1aef56b47a91adf3d3294c433bb29b035b3020d04a76200da0a': 'Version B'
};

export const versionsStartBlockRecord: Record<string, number> = {
    '0xe6f4e6ab58d6ba4ba2f684527354156c009e4969066427ce18735422180b38f4': 490089,
    '0xff2c145fd797e1aef56b47a91adf3d3294c433bb29b035b3020d04a76200da0a': 1382305
};

function VersionState ({ className = '', address, current, pkInfos, isLoading: summaryLoading }: Props): React.ReactElement<Props> {
    const { t } = useTranslation();
    const { api } = useApi();
    const [isLoading, setIsLoading] = useState<boolean>(summaryLoading);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [addressVersionStateInfo, setAddressVersionStateInfo] = useState<AddressVersionState>();

    useEffect(() => {
        api.query.swork.groups(address).then(res => {
            const groupInfo = JSON.parse(JSON.stringify(res))
            const members = groupInfo.members
            if (members && members.length) {
                setIsOwner(true);
                
                api.query.swork?.identities?.multi(members).then(res => {
                    const identities = JSON.parse(JSON.stringify(res));
                    const memberVersions = identities.map((identity: { anchor: string; }, index: number) => {
                        const pkIndex = _.findIndex(pkInfos, e => e.anchor == identity.anchor);
                        return {
                            address: members[index],
                            version: pkInfos[pkIndex]?.code
                        }
                    })
                    const versionGroup = _.groupBy(memberVersions, 'version');
                    const memberVersionGroup: [string, MemberVersions[]][] = [];
                    const sworkerVersion: SworkerVersion[] = [];
                    const versionCount: Record<string, number> = {};

                    Object.entries(versionGroup).forEach(([code, members]) => {
                        versionCount[versionsRecord[code]] = members.length
                        sworkerVersion.push({
                            version: versionsRecord[code],
                            count: members.length
                        })
                        memberVersionGroup.push([versionsRecord[code], members as unknown as MemberVersions[]])
                    })

                    setAddressVersionStateInfo({
                        owner: address,
                        memberVersions: memberVersions as unknown as MemberVersions[],
                        memberVersionGroup,
                        versions: sworkerVersion,
                        versionCount
                    })

                    setIsLoading(false)
                })
            } else {
                setIsOwner(false);
                api.query.swork?.identities(address).then(res => {
                    const identities = JSON.parse(JSON.stringify(res));
                    if (identities) {
                        const pkIndex = _.findIndex(pkInfos, e => e.anchor == identities.anchor);
                        const memberVersions = [];
                        memberVersions.push({
                            address,
                            version: pkInfos[pkIndex]?.code
                        })
                        setAddressVersionStateInfo({
                            memberVersions: memberVersions as unknown as MemberVersions[]
                        })
                        setIsLoading(false)
                    } else {
                        setAddressVersionStateInfo(undefined)
                    }        
                }).finally(() => setIsLoading(false))
            }
        })
    }, [api, address, pkInfos])

    const ownerHeaderRef = useRef([
        [t('Group Owner'), 'start'],
        [t('Members')],
        [t('Version A')],
        [t('Version B')]
    ]);

    const memberHeaderRef = useRef([
        [t('Group Member'), 'start'],
        [t('Version'), 'start'],
    ]);

    return (
        <div className={className}>
            {
                isOwner ?
                (<>
                    <Table
                        header={ownerHeaderRef.current}
                        empty={ !isLoading && !addressVersionStateInfo && t<string>('No funds group owner yet.')}
                    >
                        {addressVersionStateInfo && (<tr className={className}>
                            <td className='start'>
                                {address}           
                            </td>
                            <td className='number'>
                                {addressVersionStateInfo.memberVersions.length}           
                            </td>
                            <td className='number'>
                                {addressVersionStateInfo.versionCount && addressVersionStateInfo.versionCount['Version A'] ? addressVersionStateInfo.versionCount['Version A'] : 0}           
                            </td>
                            <td className='number'>
                                {addressVersionStateInfo.versionCount && addressVersionStateInfo.versionCount['Version B'] ? addressVersionStateInfo.versionCount['Version B'] : 0}           
                            </td>
                        </tr>)}
                    </Table>
                    <Card>
                        <Columar>
                            {
                                addressVersionStateInfo && addressVersionStateInfo.memberVersionGroup?.map((e): React.ReactNode => (
                                    <Columar.Column>
                                        <Table
                                            header={memberHeaderRef.current}
                                            empty={!isLoading && !addressVersionStateInfo && t<string>('No funds group member yet.')}
                                        >
                                            {e[1] && e[1]?.map((mv): React.ReactNode => (
                                                <MemberVersionDisplay
                                                    key={mv.address}
                                                    memberVersion={mv}
                                                    current={current}
                                                />
                                            ))}
                                        </Table>
                                    </Columar.Column>
                                ))
                            }
                        </Columar>                       
                    </Card>
                </>) :
                (<>
                    <Table
                        header={memberHeaderRef.current}
                        empty={!isLoading && !addressVersionStateInfo && t<string>('No funds group member yet.')}
                    >
                        {addressVersionStateInfo && addressVersionStateInfo.memberVersions?.map((mv): React.ReactNode => (
                            <MemberVersionDisplay
                                key={mv.address}
                                memberVersion={mv}
                                current={current}
                            />
                        ))}
                    </Table>
                </>)
            }
        </div>
    );
}

export default React.memo(styled(VersionState)`
    .filter--tags {
        .ui--Dropdown {
            padding-left: 0;

            label {
                left: 1.55rem;
            }
        }
    }
`);
