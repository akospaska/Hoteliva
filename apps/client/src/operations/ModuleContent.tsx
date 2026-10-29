import { useClock } from './use-clock';
import { useState } from 'react';
import { View } from 'react-native';
import { Action, Field, Label, Panel, Row, Select } from '../design-system/components';
import { Assistant, Insights } from './Insights';
import { Team } from './Team';
import { Roles } from './Roles';
import { Minibar } from './Minibar';
import { QuickTemplates } from './QuickTemplates';
import { Calendar } from './Calendar';
import { RoomHistory } from './RoomHistory';
import { Analytics } from './Analytics';
import { DailyPlan } from './DailyPlan';
import { AuditSummary } from './AuditSummary';
import { RoomBoard } from './RoomBoard';
import { Disclosure } from '../design-system/disclosure';
import { RecordList } from './RecordList';
import { displayLabel, kindLabel } from './modules';
import { printLabels, type QrLabel } from './qr-print';
import type { ItemInput, Module } from './types';
import type { WorkspaceState } from './use-workspace';

export function ModuleContent({
  module,
  state,
  en,
  hotelId,
  onCreate,
  onOpen,
}: {
  module: Module;
  state: WorkspaceState;
  en: boolean;
  hotelId: string;
  onCreate: (kind: string, initial?: Partial<ItemInput>) => void;
  onOpen: (id: string) => void;
}) {
  const now = useClock();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [subkind, setSubkind] = useState('');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');
  const t = (hu: string, english: string) => (en ? english : hu);
  const snapshot = state.snapshot!;
  const scoped = {
    ...snapshot,
    records: snapshot.records.filter((r) => !hotelId || r.hotelId === hotelId || r._id === hotelId),
  };
  if (module.view === 'analytics')
    return <Analytics snapshot={scoped} state={state} en={en} onOpen={onOpen} />;
  if (module.view === 'assistant') return <Assistant {...{ state, en, onOpen }} />;
  if (module.view === 'history') return <RoomHistory snapshot={scoped} en={en} onOpen={onOpen} />;
  if (['dashboard', 'analytics'].includes(module.view))
    return (
      <Insights snapshot={scoped} en={en} analytics={module.view === 'analytics'} onOpen={onOpen} />
    );
  const alternatives =
    module.id === 'F05'
      ? ['routine', 'template']
      : module.view === 'overdue'
        ? ['task', 'policy']
        : module.view === 'social'
          ? ['conversation', 'announcement', 'poll', 'idea', 'event']
          : module.view === 'inventory'
            ? ['found', 'stock']
            : module.view === 'minibar'
              ? ['consumption', 'product']
              : module.id === 'F01'
                ? ['location', 'hotel']
                : [module.kind];
  const kind = alternatives.includes(subkind) ? subkind : alternatives[0];
  let records = scoped.records.filter((r) => r.kind === kind);
  if (module.id === 'F05' && kind === 'routine')
    records = scoped.records.filter(
      (r) =>
        !['done', 'cancelled', 'active', 'draft', 'published'].includes(r.status) &&
        (r.data.templateVersion || r.data.sourceVersion) &&
        (!r.dueAt || Date.parse(r.dueAt) <= now),
    );
  if (module.view === 'overdue' && kind !== 'policy')
    records = scoped.records.filter(
      (r) =>
        !['done', 'cancelled', 'active', 'published'].includes(r.status) &&
        r.dueAt &&
        Date.parse(r.dueAt) < now,
    );
  if (module.view === 'bookmarks')
    records = scoped.records.filter((r) =>
      snapshot.preferences.some((p) => p.recordId === r._id && (p.bookmarked || p.remindAt)),
    );
  if (module.view === 'translation')
    records = scoped.records.filter((r) => !['hotel', 'location'].includes(r.kind));
  records = records.filter(
    (r) =>
      (!status || r.status === status || r.data.cleanliness === status) &&
      `${r.title} ${r.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  if (['F03', 'F04', 'F05', 'F06', 'F11', 'F14'].includes(module.id)) {
    const priority: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    records.sort(
      (a, b) =>
        priority[a.priority] - priority[b.priority] ||
        (a.dueAt || 'z').localeCompare(b.dueAt || 'z'),
    );
  }
  return (
    <View style={{ gap: 20 }}>
      {module.id === 'F24' && <AuditSummary records={scoped.records} en={en} />}
      {module.view === 'cleaning' && snapshot.context!.manager && (
        <DailyPlan state={state} en={en} hotelId={hotelId} />
      )}
      {module.view === 'cleaning' && (
        <RoomBoard
          rooms={scoped.records.filter((r) => r.kind === 'location')}
          en={en}
          onOpen={onOpen}
        />
      )}
      {['F20', 'F27'].includes(module.id) && (
        <Disclosure title={t('Közös naptár', 'Shared calendar')}>
          <Calendar records={scoped.records} en={en} onOpen={onOpen} />
        </Disclosure>
      )}
      {module.view === 'quick' && (
        <QuickTemplates state={state} en={en} hotelId={hotelId} onCreate={onCreate} />
      )}
      {module.view === 'minibar' && <Minibar state={state} en={en} hotelId={hotelId} />}
      {module.view === 'quick' && (
        <Panel>
          <Label strong size={22}>
            {t('Mit szeretnél jelezni?', 'What would you like to report?')}
          </Label>
          <Row>
            {[
              ['task', 'maintenance', t('Műszaki hiba', 'Repair needed')],
              ['cleaning', 'housekeeping', t('Takarítás szükséges', 'Cleaning needed')],
              ['request', 'reception', t('Vendégkérés', 'Guest request')],
            ].map(([kind, department, label]) => (
              <Action key={kind} onPress={() => onCreate(kind, { department, hotelId })}>
                {label}
              </Action>
            ))}
          </Row>
        </Panel>
      )}
      {module.view === 'team' && <Team {...{ state, en }} />}
      {module.view === 'team' &&
        ['platform_admin', 'group_admin'].includes(snapshot.context!.role) && (
          <Roles state={state} en={en} />
        )}
      {alternatives.length > 1 && (
        <Row>
          {alternatives.map((k) => (
            <Action key={k} secondary={kind !== k} onPress={() => setSubkind(k)}>
              {kindLabel(k, en ? 'en' : 'hu')}
            </Action>
          ))}
        </Row>
      )}
      <Row style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <Field label={t('Keresés', 'Search')} value={search} onChangeText={setSearch} />
        </View>
        <View style={{ minWidth: 170 }}>
          <Select
            label={t('Állapot', 'Status')}
            value={status}
            options={[
              'open',
              'assigned',
              'in_progress',
              'blocked',
              'review',
              'done',
              'dirty',
              'clean',
              'draft',
              'published',
            ].map((value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }))}
            onChange={setStatus}
            empty={t('Minden állapot', 'All statuses')}
          />
        </View>
        <Action
          onPress={() => onCreate(kind === 'routine' ? 'template' : kind, { hotelId })}
        >{`+ ${kindLabel(kind === 'routine' ? 'template' : kind, en ? 'en' : 'hu')}`}</Action>
      </Row>
      {module.id === 'F02' && records.length > 0 && (
        <Action
          secondary
          disabled={state.busy}
          onPress={() =>
            void state.run(async () =>
              printLabels(
                await state.request<QrLabel[]>('/qr', 'POST', {
                  ids: records.slice(0, 100).map((r) => r._id),
                }),
              ),
            )
          }
        >
          {t('Szűrt QR-címkék nyomtatása (max. 100)', 'Print filtered QR labels (max. 100)')}
        </Action>
      )}
      {module.view === 'rooms' && kind === 'location' ? (
        <RoomBoard rooms={records} en={en} onOpen={onOpen} />
      ) : (
        <RecordList items={records} snapshot={snapshot} en={en} rooms={false} onOpen={onOpen} />
      )}
      {module.id === 'F01' && snapshot.context?.manager && (
        <Panel>
          <Label strong>{t('Szobák tömeges felvétele', 'Bulk room import')}</Label>
          <Label muted>
            {t(
              'Előbb válassz hotelt. Soronként: szobanév;emelet;kategória',
              'Select a hotel first. One room per line: name;floor;category',
            )}
          </Label>
          <Field
            label={t('Szobák', 'Rooms')}
            value={importText}
            onChangeText={setImportText}
            multiline
          />
          <Action
            disabled={!hotelId || !importText.trim() || state.busy}
            onPress={() =>
              void state.run(async () => {
                const rows = importText
                  .trim()
                  .split('\n')
                  .map((line) => {
                    const [title, floor = '', category = ''] = line.split(';');
                    return { title, floor, category };
                  });
                const result = await state.request<
                  { title: string; id?: string; error?: string }[]
                >('/import-locations', 'POST', { hotelId, rows });
                setImportResult(result.map((r) => `${r.title}: ${r.error || '✓'}`).join('\n'));
                setImportText('');
              })
            }
          >
            {t('Importálás', 'Import')}
          </Action>
          {!!importResult && <Label>{importResult}</Label>}
        </Panel>
      )}
    </View>
  );
}
