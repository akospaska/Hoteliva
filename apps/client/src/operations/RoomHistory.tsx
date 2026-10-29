import { useState } from 'react';
import { View } from 'react-native';
import { Field, Label, Panel, Row, Select } from '../design-system/components';
import { displayLabel } from './modules';
import { RecordList } from './RecordList';
import type { Snapshot } from './types';

export function RoomHistory({
  snapshot,
  en,
  onOpen,
}: {
  snapshot: Snapshot;
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const [room, setRoom] = useState('');
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const records = snapshot.records
    .filter(
      (r) =>
        r.locationId &&
        (!room || r.locationId === room) &&
        (!kind || r.kind === kind) &&
        (!status || r.status === status) &&
        (!from || r.createdAt.slice(0, 10) >= from) &&
        (!to || r.createdAt.slice(0, 10) <= to),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const repeats = new Map<string, number>();
  records
    .filter((r) => r.kind === 'task')
    .forEach((r) => repeats.set(r.title, (repeats.get(r.title) || 0) + 1));
  return (
    <View style={{ gap: 20 }}>
      <Panel>
        <Select
          label={en ? 'Room / location' : 'Szoba / helyszín'}
          value={room}
          options={snapshot.records
            .filter((r) => r.kind === 'location')
            .map((r) => ({ value: r._id, label: r.title }))}
          onChange={setRoom}
        />
        <Select
          label={en ? 'Event type' : 'Eseménytípus'}
          value={kind}
          options={['task', 'cleaning', 'round', 'consumption', 'request', 'incident'].map(
            (value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }),
          )}
          onChange={setKind}
        />
        <Select
          label={en ? 'Status' : 'Állapot'}
          value={status}
          onChange={setStatus}
          options={[
            'open',
            'assigned',
            'in_progress',
            'blocked',
            'review',
            'done',
            'cancelled',
          ].map((value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }))}
        />
        <Row>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Field
              label={en ? 'From (YYYY-MM-DD)' : 'Ettől (ÉÉÉÉ-HH-NN)'}
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Field
              label={en ? 'To (YYYY-MM-DD)' : 'Eddig (ÉÉÉÉ-HH-NN)'}
              value={to}
              onChangeText={setTo}
            />
          </View>
        </Row>
        {[...repeats]
          .filter(([, count]) => count > 1)
          .map(([title, count]) => (
            <Label key={title}>
              {en ? 'Repeated report' : 'Ismétlődő bejelentés'}: {title} ({count})
            </Label>
          ))}
      </Panel>
      <RecordList items={records} snapshot={snapshot} en={en} onOpen={onOpen} />
    </View>
  );
}
