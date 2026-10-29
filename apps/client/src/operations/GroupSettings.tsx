import { useState } from 'react';
import { Action, Field, Label, Panel, Select } from '../design-system/components';
import { api } from '../lib/api';
import type { Snapshot } from './types';
import type { WorkspaceState } from './use-workspace';

export function GroupSettings({
  group,
  state,
  en,
}: {
  group: Snapshot['groups'][number];
  state: WorkspaceState;
  en: boolean;
}) {
  const [name, setName] = useState(group.name);
  const [users, setUsers] = useState(String(group.maxUsers));
  const [rooms, setRooms] = useState(String(group.maxRooms));
  const [status, setStatus] = useState(group.status);
  const [notice, setNotice] = useState('');
  return (
    <Panel>
      <Label strong size={18}>
        {en ? 'Contract limits & group status' : 'Szerződéses keretek és csoportállapot'}
      </Label>
      <Label muted>
        {en
          ? `${group.seats} occupied user seats. Lowering a limit keeps existing access; new additions will be blocked.`
          : `${group.seats} foglalt felhasználói hely. A keretcsökkentés megtartja a meglévő hozzáféréseket, de blokkolja az új hozzáadást.`}
      </Label>
      <Field label={en ? 'Group name' : 'Csoport neve'} value={name} onChangeText={setName} />
      <Field
        label={en ? 'User limit' : 'Felhasználói keret módosítása'}
        value={users}
        onChangeText={setUsers}
        keyboardType="numeric"
      />
      <Field
        label={en ? 'Room limit' : 'Szobakeret módosítása'}
        value={rooms}
        onChangeText={setRooms}
        keyboardType="numeric"
      />
      <Select
        label={en ? 'Group status' : 'Csoport állapota'}
        value={status}
        onChange={(v) => setStatus(v || 'active')}
        options={[
          { value: 'active', label: en ? 'Active' : 'Aktív' },
          {
            value: 'suspended',
            label: en
              ? 'Suspended — members lose access'
              : 'Felfüggesztve — a munkatársak elveszítik a hozzáférést',
          },
        ]}
      />
      <Action
        busy={state.busy}
        danger={status === 'suspended'}
        onPress={() =>
          void state.run(async () => {
            await api(`/platform/groups/${group._id}`, 'PUT', {
              name,
              maxUsers: Number(users),
              maxRooms: Number(rooms),
              status,
            });
            setNotice(en ? 'Group settings saved.' : 'Csoportbeállítások mentve.');
          })
        }
      >
        {en ? 'Save group settings' : 'Csoportbeállítások mentése'}
      </Action>
      {!!notice && <Label>{notice}</Label>}
    </Panel>
  );
}
