import { PermissionEditor } from './PermissionEditor';
import { useState } from 'react';
import { Action, Label, Panel, Row, Select } from '../design-system/components';
import type { Member } from './types';
import type { WorkspaceState } from './use-workspace';

export function Team({ state, en }: { state: WorkspaceState; en: boolean }) {
  const snapshot = state.snapshot!;
  const [userId, setUserId] = useState('');
  const [draft, setDraft] = useState<Member>();
  const [confirm, setConfirm] = useState(false);
  const [replacementId, setReplacementId] = useState('');
  const t = (hu: string, english: string) => (en ? english : hu);
  if (!['platform_admin', 'group_admin'].includes(snapshot.context!.role)) return null;
  function select(id: string) {
    setUserId(id);
    setConfirm(false);
    setDraft(
      snapshot.memberships.find((m) => m.userId === id) || {
        userId: id,
        hotelIds: [],
        locationIds: [],
        departments: [],
        permissions: [],
        vendorId: '',
      },
    );
  }
  const toggle = (key: 'hotelIds' | 'locationIds' | 'departments' | 'permissions', value: string) =>
    setDraft(
      (d) =>
        d && {
          ...d,
          [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
        },
    );
  return (
    <Panel>
      <Label strong size={20}>
        {t('Hozzáférések és külsős munkatársak', 'Access & external colleagues')}
      </Label>
      <Label muted>
        {t(
          'Új felhasználót platformadmin hívhat meg. Itt a meglévő munkatárs helyszíneit és engedélyeit állíthatod be.',
          'A platform admin can invite new users. Manage existing members’ locations and permissions here.',
        )}
      </Label>
      <Select
        label={t('Munkatárs', 'Colleague')}
        value={userId}
        options={snapshot.people
          .filter((p) => p.role === 'member' && p.status === 'active')
          .map((p) => ({ value: p._id, label: p.name }))}
        onChange={select}
      />
      {!!draft && !!userId && (
        <>
          <Select
            label={t('Külsős cég', 'External vendor')}
            value={draft.vendorId}
            options={snapshot.records
              .filter((r) => r.kind === 'vendor')
              .map((r) => ({ value: r._id, label: r.title }))}
            onChange={(vendorId) => setDraft({ ...draft, vendorId })}
          />
          <Label strong>{t('Hotelek', 'Hotels')}</Label>
          <Row>
            {snapshot.records
              .filter((r) => r.kind === 'hotel')
              .map((r) => (
                <Action
                  key={r._id}
                  secondary={!draft.hotelIds.includes(r._id)}
                  onPress={() => toggle('hotelIds', r._id)}
                >
                  {r.title}
                </Action>
              ))}
          </Row>
          <Label strong>
            {t(
              'Helyszínkorlát (üres: minden kijelölt hotelbeli helyszín)',
              'Location restriction (empty: all locations in selected hotels)',
            )}
          </Label>
          <Row>
            {snapshot.records
              .filter((r) => r.kind === 'location' && draft.hotelIds.includes(r.hotelId))
              .map((r) => (
                <Action
                  key={r._id}
                  secondary={!draft.locationIds.includes(r._id)}
                  onPress={() => toggle('locationIds', r._id)}
                >
                  {r.title}
                </Action>
              ))}
          </Row>
          <Label strong>{t('Engedélyek', 'Permissions')}</Label>
          <PermissionEditor
            value={draft.permissions}
            onChange={(permissions) => setDraft({ ...draft, permissions })}
            en={en}
          />
          <Label strong>{t('Hozzárendelt szerepkörök', 'Assigned roles')}</Label>
          <Row>
            {snapshot.records
              .filter((r) => r.kind === 'role' && r.status === 'active')
              .map((r) => (
                <Action
                  key={r._id}
                  secondary={!draft.roleIds?.includes(r._id)}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      roleIds: draft.roleIds?.includes(r._id)
                        ? draft.roleIds.filter((id) => id !== r._id)
                        : [...(draft.roleIds || []), r._id],
                    })
                  }
                >
                  {r.title}
                </Action>
              ))}
          </Row>
          <Action
            busy={state.busy}
            onPress={() =>
              void state.run(() =>
                state.request('/memberships', 'POST', {
                  userId: draft.userId,
                  hotelIds: draft.hotelIds,
                  locationIds: draft.locationIds,
                  departments: draft.departments,
                  permissions: draft.permissions,
                  vendorId: draft.vendorId,
                  roleIds: draft.roleIds || [],
                }),
              )
            }
          >
            {t('Hozzáférés mentése', 'Save access')}
          </Action>
          <Select
            label={t('Nyitott munkák átadása', 'Transfer open work')}
            value={replacementId}
            options={snapshot.people
              .filter((p) => p._id !== userId && p.status === 'active')
              .map((p) => ({ value: p._id, label: p.name }))}
            empty={t('Felelős nélkül, újra kiosztható', 'Unassigned, ready for reassignment')}
            onChange={setReplacementId}
          />
          <Action
            danger
            disabled={state.busy}
            onPress={() => {
              if (!confirm) setConfirm(true);
              else
                void state.run(async () => {
                  await state.request(`/people/${userId}/disable`, 'POST', { replacementId });
                  setUserId('');
                  setDraft(undefined);
                });
            }}
          >
            {confirm
              ? t(
                  'Biztosan deaktiválom és visszavonom a munkameneteit',
                  'Confirm deactivation and revoke sessions',
                )
              : t('Munkatárs deaktiválása', 'Deactivate colleague')}
          </Action>
        </>
      )}
    </Panel>
  );
}
