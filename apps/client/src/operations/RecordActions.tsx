import { useState } from 'react';
import { Action, Field, Label, Panel, Row, Select } from '../design-system/components';
import { displayLabel } from './modules';
import type { Item } from './types';
import type { WorkspaceState } from './use-workspace';

export function RecordActions({
  item,
  state,
  en,
}: {
  item: Item;
  state: WorkspaceState;
  en: boolean;
}) {
  const t = (hu: string, english: string) => (en ? english : hu);
  const [reason, setReason] = useState('');
  const [value, setValue] = useState('');
  const [holder, setHolder] = useState('');
  const context = state.snapshot!.context!;
  const manager = context.manager || context.permissions.includes(`${item.kind}:manage`);
  const worker = manager || item.assigneeId === context.userId;
  const approve = context.manager || context.permissions.includes(`${item.kind}:approve`);
  const active = ['open', 'assigned', 'in_progress', 'blocked'].includes(item.status);
  const act = (action: string, extra: object = {}) => void state.act(item, action, extra);
  const button = (action: string, title: string, extra: object = {}, secondary = false) => (
    <Action
      key={action}
      secondary={secondary}
      disabled={state.busy}
      onPress={() => act(action, extra)}
    >
      {title}
    </Action>
  );
  const people = state.snapshot!.people.map((p) => ({ value: p._id, label: p.name }));
  return (
    <Panel>
      <Label strong size={18}>
        {t('Műveletek', 'Actions')}
      </Label>
      <Row>
        {['announcement', 'idea', 'conversation'].includes(item.kind) &&
          ['like', 'thanks', 'idea'].map((reaction, i) => (
            <Action
              key={reaction}
              secondary
              disabled={state.busy}
              onPress={() => act('react', { value: reaction })}
            >{`${['👍', '🙏', '💡'][i]} ${Array.isArray(item.data.reactions) ? item.data.reactions.filter((v) => v.endsWith(`:${reaction}`)).length : 0}`}</Action>
          ))}
        {manager &&
          item.kind === 'purchase' &&
          item.status === 'approved' &&
          button('receive', t('Beszerzés átvéve', 'Purchase received'))}
        {manager &&
          item.kind === 'consumption' &&
          item.status === 'open' &&
          button('process', t('Recepción feldolgozva', 'Processed by front office'))}
        {!item.assigneeId && active && button('claim', t('Elvállalom', 'Claim'))}
        {!!worker &&
          ['open', 'assigned', 'blocked'].includes(item.status) &&
          button('start', t('Munka indítása', 'Start work'))}
        {!!worker && active && button('complete', t('Ellenőrzésre küldés', 'Submit for review'))}
        {!!approve &&
          ['review', 'pending'].includes(item.status) &&
          button('approve', t('Jóváhagyás', 'Approve'))}
        {!!manager &&
          item.status === 'draft' &&
          ['article', 'poll', 'announcement', 'idea'].includes(item.kind) &&
          button('publish', t('Közzététel', 'Publish'))}
        {(['article', 'handover', 'announcement', 'onboarding', 'conversation'].includes(
          item.kind,
        ) ||
          (item.kind === 'asset' && item.data.holderId === context.userId)) &&
          button('acknowledge', t('Elolvastam / átvettem', 'Read / received'), {}, true)}
        {!!manager &&
          ['done', 'cancelled'].includes(item.status) &&
          button('reopen', t('Újranyitás', 'Reopen'), {}, true)}
        {item.kind === 'template' && (
          <Action
            disabled={state.busy}
            onPress={() =>
              void state.run(() =>
                state.request(`/records/${item._id}/instantiate`, 'POST', { dueAt: '' }),
              )
            }
          >
            {t('Munka létrehozása sablonból', 'Create work from template')}
          </Action>
        )}
      </Row>
      {item.kind === 'location' &&
        manager &&
        ['occupancy', 'cleanliness', 'maintenance', 'service'].map((key, i) => (
          <Select
            key={key}
            label={
              [
                t('Foglaltság', 'Occupancy'),
                t('Tisztaság', 'Cleanliness'),
                t('Műszaki állapot', 'Maintenance'),
                t('Takarítási szabály', 'Service rule'),
              ][i]
            }
            value={String(item.data[key] || '')}
            options={[
              ['vacant', 'occupied'],
              ['dirty', 'cleaning', 'review', 'clean'],
              ['available', 'blocked'],
              ['normal', 'dnd', 'skip', 'vip'],
            ][i].map((value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }))}
            onChange={(v) => {
              if (v) act('room-state', { data: { [key]: v } });
            }}
          />
        ))}
      {item.kind === 'poll' &&
        item.status === 'published' &&
        Array.isArray(item.data.options) &&
        item.data.options.map((option) => (
          <Action
            key={option}
            secondary
            disabled={state.busy}
            onPress={() => act('vote', { value: option })}
          >{`${option} · ${Array.isArray(item.data.votes) ? item.data.votes.filter((v) => v.endsWith(`:${option}`)).length : 0}`}</Action>
        ))}
      {!!manager && item.kind === 'asset' && !item.data.holderId && (
        <>
          <Select
            label={t('Átvevő', 'Recipient')}
            value={holder}
            options={people}
            onChange={setHolder}
          />
          <Action
            disabled={!holder || state.busy}
            onPress={() => act('checkout', { data: { holderId: holder } })}
          >
            {t('Eszköz kiadása', 'Check out equipment')}
          </Action>
        </>
      )}
      {((worker && active) || manager || approve) && (
        <Field
          label={t('Indoklás / átadási megjegyzés', 'Reason / handover note')}
          value={reason}
          onChangeText={setReason}
        />
      )}
      <Row>
        {!!reason &&
          worker &&
          active &&
          button('block', t('Elakadás jelzése', 'Report blocker'), { text: reason }, true)}
        {!!reason &&
          approve &&
          ['review', 'pending'].includes(item.status) &&
          button(
            'reject',
            t('Visszaküldés javításra', 'Return for correction'),
            { text: reason },
            true,
          )}
        {!!reason &&
          manager &&
          !['done', 'archived', 'cancelled'].includes(item.status) &&
          button('cancel', t('Visszavonás', 'Cancel item'), { text: reason }, true)}
        {!!reason &&
          manager &&
          (item.kind === 'found' || (item.kind === 'asset' && !!item.data.holderId)) &&
          button('return', t('Visszaadás rögzítése', 'Record return'), { text: reason })}
      </Row>
      {!!manager && ['stock', 'product', 'complaint'].includes(item.kind) && (
        <>
          <Field
            label={
              item.kind === 'complaint'
                ? t('Kompenzáció összege', 'Compensation amount')
                : t('Készletváltozás (+ / −)', 'Stock movement (+ / −)')
            }
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
          />
          <Action
            disabled={!reason || !value || state.busy}
            onPress={() =>
              act(item.kind === 'complaint' ? 'compensate' : 'stock', {
                value: Number(value),
                text: reason,
              })
            }
          >
            {t('Rögzítés', 'Record')}
          </Action>
        </>
      )}
      {manager && item.kind === 'asset' && (
        <>
          <Field
            label={t('Mérőállás', 'Meter reading')}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
          />
          <Action
            disabled={!value || state.busy}
            onPress={() => act('reading', { value: Number(value), text: reason })}
          >
            {t('Mérőállás rögzítése', 'Record meter reading')}
          </Action>
        </>
      )}
    </Panel>
  );
}
