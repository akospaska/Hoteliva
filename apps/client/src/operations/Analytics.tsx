import type { WorkspaceState } from './use-workspace';
import { useState } from 'react';
import { View } from 'react-native';
import { Action, Field, Label, Panel, Row, Select } from '../design-system/components';
import { RecordList } from './RecordList';
import { displayLabel } from './modules';
import type { Snapshot } from './types';

export function Analytics({
  snapshot,
  state,
  en,
  onOpen,
}: {
  snapshot: Snapshot;
  state: WorkspaceState;
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const [department, setDepartment] = useState(snapshot.reportFilter?.department || '');
  const [from, setFrom] = useState(snapshot.reportFilter?.from || '');
  const [to, setTo] = useState(snapshot.reportFilter?.to || '');
  const [assignee, setAssignee] = useState(snapshot.reportFilter?.assignee || '');
  const t = (hu: string, english: string) => (en ? english : hu);
  const work = snapshot.records.filter(
    (r) =>
      ['task', 'cleaning', 'request', 'round', 'audit', 'complaint'].includes(r.kind) &&
      (!department || r.department === department) &&
      (!assignee || r.assigneeId === assignee) &&
      (!from || r.createdAt.slice(0, 10) >= from) &&
      (!to || r.createdAt.slice(0, 10) <= to),
  );
  const closed = work.filter((r) => r.status === 'done');
  const active = work.reduce((sum, r) => sum + Number(r.data.activeMilliseconds || 0), 0) / 60000;
  const waiting = work.reduce((sum, r) => sum + Number(r.data.waitingMilliseconds || 0), 0) / 60000;
  const lead = closed
    .filter((r) => r.data.approvedAt)
    .map((r) => (Date.parse(String(r.data.approvedAt)) - Date.parse(r.createdAt)) / 60000);
  const metrics = [
    [t('Lezárt munkák', 'Closed work'), closed.length],
    [t('Rögzített aktív idő (perc)', 'Recorded active time (minutes)'), Math.round(active)],
    [t('Rögzített várakozás (perc)', 'Recorded waiting time (minutes)'), Math.round(waiting)],
    [
      t('Átlagos átfutás (perc)', 'Average lead time (minutes)'),
      lead.length ? Math.round(lead.reduce((a, b) => a + b, 0) / lead.length) : '—',
    ],
  ];
  return (
    <View style={{ gap: 20 }}>
      <Panel>
        <Row>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Select
              label={t('Részleg', 'Department')}
              value={department}
              onChange={setDepartment}
              options={['housekeeping', 'maintenance', 'reception', 'management', 'hr'].map(
                (value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }),
              )}
            />
          </View>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Select
              label={t('Munkatárs', 'Colleague')}
              value={assignee}
              onChange={setAssignee}
              options={snapshot.people.map((p) => ({ value: p._id, label: p.name }))}
            />
          </View>
        </Row>
        <Row>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Field
              label={t('Ettől (ÉÉÉÉ-HH-NN)', 'From (YYYY-MM-DD)')}
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Field
              label={t('Eddig (ÉÉÉÉ-HH-NN)', 'To (YYYY-MM-DD)')}
              value={to}
              onChangeText={setTo}
            />
          </View>
        </Row>
        <Action
          secondary
          disabled={state.busy}
          onPress={() =>
            void state.run(() =>
              state.request('/report-filter', 'PUT', { department, assignee, from, to }),
            )
          }
        >
          {t('Saját alapnézet mentése', 'Save my default view')}
        </Action>
      </Panel>
      <Row style={{ alignItems: 'stretch' }}>
        {metrics.map(([label, value]) => (
          <Panel key={label} style={{ flex: 1, minWidth: 180 }}>
            <Label muted size={12}>
              {label}
            </Label>
            <Label strong size={32}>
              {value}
            </Label>
          </Panel>
        ))}
      </Row>
      <Panel>
        <Label strong size={20}>
          {t('Tervezett terhelés munkatársanként', 'Planned workload by colleague')}
        </Label>
        {snapshot.people.map((p) => {
          const assigned = work.filter(
            (r) => r.assigneeId === p._id && !['done', 'cancelled'].includes(r.status),
          );
          return (
            <Row key={p._id} style={{ justifyContent: 'space-between' }}>
              <Label>{p.name}</Label>
              <Label muted>
                {assigned.length} {t('munka', 'tasks')} ·{' '}
                {assigned.reduce((sum, r) => sum + Number(r.data.estimatedMinutes || 0), 0)}{' '}
                {t('perc', 'minutes')}
              </Label>
            </Row>
          );
        })}
        <Label muted size={11}>
          {t(
            'Az aktív és várakozási idők lezárt munkaszakaszokból számolódnak. Az átfutás a létrehozástól a jóváhagyásig tart.',
            'Active and waiting times use completed work segments. Lead time runs from creation to approval.',
          )}
        </Label>
      </Panel>
      <RecordList items={work} snapshot={snapshot} en={en} onOpen={onOpen} />
    </View>
  );
}
