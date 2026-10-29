import { useState } from 'react';
import { Action, Field, Label, Panel, Select } from '../design-system/components';
import { api } from '../lib/api';
import { GroupSettings } from './GroupSettings';
import type { WorkspaceState } from './use-workspace';

export function PlatformAdmin({
  state,
  en,
  groupId,
  hotelId,
}: {
  state: WorkspaceState;
  en: boolean;
  groupId: string;
  hotelId: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [person, setPerson] = useState('');
  const [role, setRole] = useState('member');
  const [users, setUsers] = useState('25');
  const [rooms, setRooms] = useState('100');
  const [notice, setNotice] = useState('');
  const t = (hu: string, english: string) => (en ? english : hu);
  const group = state.snapshot?.groups.find((g) => g._id === groupId);
  return (
    <Panel>
      {!!group && <GroupSettings key={group._id} group={group} state={state} en={en} />}
      <Label strong size={20}>
        {t('Platformadmin · ügyfélkezelés', 'Platform admin · clients')}
      </Label>
      <Field
        label={t('Új hotelcsoport neve', 'New hotel group name')}
        value={name}
        onChangeText={setName}
      />
      <Field
        label={t('Felhasználói keret', 'User limit')}
        value={users}
        onChangeText={setUsers}
        keyboardType="numeric"
      />
      <Field
        label={t('Szobakeret', 'Room limit')}
        value={rooms}
        onChangeText={setRooms}
        keyboardType="numeric"
      />
      <Action
        disabled={!name.trim() || state.busy}
        onPress={() =>
          void state.run(async () => {
            await api('/platform/groups', 'POST', {
              name,
              maxUsers: Number(users),
              maxRooms: Number(rooms),
            });
            setName('');
            setNotice(t('Hotelcsoport létrehozva.', 'Hotel group created.'));
          })
        }
      >
        {t('Hotelcsoport létrehozása', 'Create hotel group')}
      </Action>
      {!!groupId && (
        <>
          <Label strong>{t('Meghívás a kiválasztott csoportba', 'Invite to selected group')}</Label>
          <Field
            label={t('Munkatárs neve', 'Colleague name')}
            value={person}
            onChangeText={setPerson}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Select
            label={t('Szerepkör', 'Role')}
            value={role}
            options={[
              { value: 'group_admin', label: t('Csoportadmin', 'Group admin') },
              { value: 'hotel_admin', label: t('Hoteladmin', 'Hotel admin') },
              { value: 'member', label: t('Munkatárs', 'Member') },
            ]}
            onChange={(v) => setRole(v || 'member')}
          />
          <Label muted>
            {t(
              'Hoteladminhoz és munkatárshoz előbb válassz hotelt. A munkatárs részletes engedélyeit a Külsős csapatok oldalon állítsd be.',
              'Select a hotel for hotel admins and members. Configure member permissions on External teams.',
            )}
          </Label>
          <Action
            disabled={!email || !person || state.busy || (role !== 'group_admin' && !hotelId)}
            onPress={() =>
              void state.run(async () => {
                const result = await api<{ emailSent: boolean }>('/platform/users', 'POST', {
                  name: person,
                  email,
                  locale: en ? 'en' : 'hu',
                  role,
                  groupId,
                  hotelIds: hotelId ? [hotelId] : [],
                });
                setEmail('');
                setPerson('');
                setNotice(
                  result.emailSent
                    ? t('Meghívó elküldve.', 'Invitation sent.')
                    : t(
                        'Fiók létrehozva, de a meghívó kézbesítése sikertelen. Újraküldés szükséges.',
                        'Account created, but invitation delivery failed. Resend is required.',
                      ),
                );
              })
            }
          >
            {t('Meghívó küldése', 'Send invitation')}
          </Action>
          {state.snapshot?.people
            .filter((p) => p.status === 'pending')
            .map((p) => (
              <Action
                key={p._id}
                secondary
                disabled={state.busy}
                onPress={() =>
                  void state.run(async () => {
                    await api(`/platform/users/${p._id}/resend`, 'POST');
                    setNotice(t('Meghívó újraküldve.', 'Invitation resent.'));
                  })
                }
              >{`${t('Újraküldés: ', 'Resend: ')}${p.name}`}</Action>
            ))}
        </>
      )}
      {!!notice && <Label>{notice}</Label>}
    </Panel>
  );
}
