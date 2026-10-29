import { useState } from 'react';
import { MeterHistory } from './MeterHistory';
import { Linking, View } from 'react-native';
import { Action, Badge, Field, Label, Panel, Row, Select } from '../design-system/components';
import { fields } from './fields';
import { displayLabel, kindLabel } from './modules';
import { Checklist } from './Checklist';
import { Comments } from './Comments';
import { RecordActions } from './RecordActions';
import { Minibar } from './Minibar';
import { QuickTemplates } from './QuickTemplates';
import { Distribute } from './Distribute';
import { PackageCopy } from './PackageCopy';
import { printLabels, type QrLabel } from './qr-print';
import type { Item, ItemInput } from './types';
import type { WorkspaceState } from './use-workspace';

export function RecordDetail({
  item,
  state,
  en,
  onEdit,
  onCreate,
  onOpen,
}: {
  item: Item;
  state: WorkspaceState;
  en: boolean;
  onEdit: () => void;
  onCreate: (kind: string, initial?: Partial<ItemInput>) => void;
  onOpen: (id: string) => void;
}) {
  const t = (hu: string, english: string) => (en ? english : hu);
  const [target, setTarget] = useState(en ? 'en' : 'hu');
  const [translation, setTranslation] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const ctx = state.snapshot!.context!;
  const manager = ctx.manager || ctx.permissions.includes(`${item.kind}:manage`);
  const preference = state.snapshot!.preferences.find((p) => p.recordId === item._id);
  const templateIds = new Set(
    state
      .snapshot!.records.filter((r) => r.kind === 'template' && r.parentId === item._id)
      .map((r) => r._id),
  );
  const related = state.snapshot!.records.filter(
    (r) =>
      r._id !== item._id &&
      (r.parentId === item._id ||
        (Array.isArray(item.data.relatedIds) && item.data.relatedIds.includes(r._id)) ||
        templateIds.has(r.parentId) ||
        (item.kind === 'location' && r.locationId === item._id)),
  );
  const create = (kind: string) =>
    onCreate(kind, {
      hotelId: item.hotelId,
      locationId: item.kind === 'location' ? item._id : item.locationId,
      parentId: item._id,
    });
  const bookmark = (bookmarked: boolean, remindAt: string | null = preference?.remindAt || null) =>
    void state.run(() =>
      state.request(`/records/${item._id}/preference`, 'POST', { bookmarked, remindAt }),
    );
  return (
    <View style={{ gap: 20 }}>
      <Panel>
        <Row style={{ justifyContent: 'space-between' }}>
          <Badge>{displayLabel(item.status, en ? 'en' : 'hu')}</Badge>
          <Row>
            {!!manager && (
              <Action secondary onPress={onEdit}>
                {t('Szerkesztés', 'Edit')}
              </Action>
            )}
            <Action secondary onPress={() => bookmark(!preference?.bookmarked)}>
              {preference?.bookmarked ? '★' : '☆'}
            </Action>
          </Row>
        </Row>
        <Label strong size={26}>
          {item.title}
        </Label>
        <Label>{item.description || t('Nincs leírás.', 'No description.')}</Label>
        {!!item.data.blockReason && (
          <Badge tone="warning">
            {displayLabel(String(item.data.blockReason), en ? 'en' : 'hu')}
          </Badge>
        )}
        <Row>
          {!!item.department && <Badge>{displayLabel(item.department, en ? 'en' : 'hu')}</Badge>}
          {item.priority !== 'normal' && (
            <Badge tone="warning">{displayLabel(item.priority, en ? 'en' : 'hu')}</Badge>
          )}
          {!!item.dueAt && (
            <Label muted>
              {t('Határidő: ', 'Due: ')}
              {new Date(item.dueAt).toLocaleString(en ? 'en-GB' : 'hu-HU')}
            </Label>
          )}
        </Row>
        {fields[item.kind]?.map(
          (f) =>
            item.data[f.key] !== undefined && (
              <View key={f.key}>
                <Label muted size={11}>
                  {en ? f.en : f.hu}
                </Label>
                <Label>
                  {Array.isArray(item.data[f.key])
                    ? (item.data[f.key] as string[])
                        .map((v) => state.snapshot!.people.find((p) => p._id === v)?.name || v)
                        .join(', ')
                    : displayLabel(String(item.data[f.key]), en ? 'en' : 'hu')}
                </Label>
              </View>
            ),
        )}
        {!!item.data.videoUrl && (
          <Action secondary onPress={() => void Linking.openURL(String(item.data.videoUrl))}>
            {t('Oktatóvideó megnyitása', 'Open training video')}
          </Action>
        )}
        {Array.isArray(item.data.receipts) && (
          <Label muted>
            {t('Visszaigazolások: ', 'Read receipts: ')}
            {item.data.receipts.length}
          </Label>
        )}
        {!!item.data.holderId && (
          <Badge>{`${t('Átvevő: ', 'Holder: ')}${state.snapshot!.people.find((p) => p._id === item.data.holderId)?.name || '—'}`}</Badge>
        )}
        {!!item.data.checkoutConfirmedAt && (
          <Badge>{t('Átvétel visszaigazolva', 'Receipt confirmed')}</Badge>
        )}
        {item.data.meterValue !== undefined && (
          <Badge>{`${t('Mérőállás: ', 'Meter reading: ')}${item.data.meterValue} ${item.data.meterUnit || ''}`}</Badge>
        )}
        {item.data.compensation !== undefined && (
          <Badge>{`${t('Kompenzáció: ', 'Compensation: ')}${item.data.compensation} · ${item.data.compensationType}`}</Badge>
        )}
        {item.kind === 'integration' && (
          <Badge tone="warning">
            {t('Éles adapter nincs csatlakoztatva', 'No live adapter connected')}
          </Badge>
        )}
      </Panel>
      {[
        'location',
        'asset',
        'event',
        'handover',
        'complaint',
        'incident',
        'audit',
        'onboarding',
        'stock',
        'found',
        'article',
      ].includes(item.kind) && (
        <Panel>
          <Label strong>{t('Gyors műveletek', 'Quick actions')}</Label>
          <Row>
            {(item.kind === 'location'
              ? ['task', 'cleaning', 'consumption', 'request', 'template']
              : ['task', 'template', 'purchase']
            ).map((kind) => (
              <Action
                key={kind}
                secondary
                onPress={() => create(kind)}
              >{`+ ${kindLabel(kind, en ? 'en' : 'hu')}`}</Action>
            ))}
          </Row>
          {!!item.qrToken && (
            <Action
              secondary
              disabled={state.busy}
              onPress={() =>
                void state.run(async () =>
                  printLabels(await state.request<QrLabel[]>('/qr', 'POST', { ids: [item._id] })),
                )
              }
            >
              {t('QR-címke nyomtatása', 'Print QR label')}
            </Action>
          )}
        </Panel>
      )}
      <Checklist {...{ item, state, en, onCreate }} />
      {item.kind === 'location' && (
        <QuickTemplates
          state={state}
          en={en}
          hotelId={item.hotelId}
          locationId={item._id}
          onCreate={onCreate}
        />
      )}
      {item.kind === 'location' && (
        <Minibar
          key={item._id}
          state={state}
          en={en}
          hotelId={item.hotelId}
          locationId={item._id}
        />
      )}
      <RecordActions {...{ item, state, en }} />
      {item.kind === 'event' && manager && <PackageCopy {...{ item, state, en, onOpen }} />}
      {item.kind === 'template' && manager && <Distribute {...{ item, state, en }} />}
      <Panel>
        <Label strong>{t('Fordítás és emlékeztető', 'Translation & reminder')}</Label>
        <Select
          label={t('Célnyelv', 'Target language')}
          value={target}
          options={['hu', 'en', 'de', 'ro', 'uk', 'pl', 'es', 'fr'].map((value) => ({
            value,
            label: value.toUpperCase(),
          }))}
          onChange={(v) => setTarget(v || 'en')}
        />
        <Action
          secondary
          disabled={state.busy}
          onPress={() =>
            void state.run(async () => {
              const result = await state.request<{ text: string }>(
                `/records/${item._id}/translate`,
                'POST',
                { target },
              );
              setTranslation(result.text);
            })
          }
        >
          {t('Fordítás DeepSeekkel', 'Translate with DeepSeek')}
        </Action>
        {!!translation && (
          <>
            <Badge>{t('Gépi fordítás · DeepSeek', 'Machine translation · DeepSeek')}</Badge>
            <Label>{translation}</Label>
          </>
        )}
        <Field
          label={t('Emlékeztető időpontja (ISO)', 'Reminder time (ISO)')}
          value={remindAt}
          onChangeText={setRemindAt}
        />
        <Row>
          <Action
            secondary
            disabled={!Number.isFinite(Date.parse(remindAt))}
            onPress={() =>
              bookmark(preference?.bookmarked || false, new Date(remindAt).toISOString())
            }
          >
            {t('Emlékeztető beállítása', 'Set reminder')}
          </Action>
          {!!preference?.remindAt && (
            <Action secondary onPress={() => bookmark(preference.bookmarked, null)}>
              {t('Emlékeztető törlése', 'Clear reminder')}
            </Action>
          )}
        </Row>
      </Panel>
      {related.length > 0 && (
        <Panel>
          <Label strong>
            {t('Kapcsolódó munkák és szobatörténet', 'Related work & room history')}
          </Label>
          {related.map((r) => (
            <Action
              key={r._id}
              secondary
              onPress={() => onOpen(r._id)}
            >{`${r.title} · ${displayLabel(r.status, en ? 'en' : 'hu')}`}</Action>
          ))}
        </Panel>
      )}
      {item.kind === 'asset' && <MeterHistory {...{ item, state, en }} />}
      <Comments {...{ item, state, en }} />
    </View>
  );
}
