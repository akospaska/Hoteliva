import { useState } from 'react';
import { Action, Field, Label, Panel, Row } from '../design-system/components';
import type { Item } from './types';
import type { WorkspaceState } from './use-workspace';

export function Distribute({
  item,
  state,
  en,
}: {
  item: Item;
  state: WorkspaceState;
  en: boolean;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [notice, setNotice] = useState('');
  const [requestId, setRequestId] = useState(
    () => `routine-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const rooms = state.snapshot!.records.filter((r) => r.kind === 'location');
  return (
    <Panel>
      <Label strong size={18}>
        {en ? 'Create work for multiple locations' : 'Munka kiadása több helyszínre'}
      </Label>
      <Label muted>
        {en
          ? 'Each location gets a separate copy of this template version. Completed checks remain independent.'
          : 'Minden helyszín külön példányt kap ebből a sablonverzióból. A teljesítések egymástól függetlenek.'}
      </Label>
      <Row>
        {rooms.map((r) => (
          <Action
            key={r._id}
            secondary={!ids.includes(r._id)}
            disabled={state.busy}
            onPress={() =>
              setIds((old) =>
                old.includes(r._id) ? old.filter((id) => id !== r._id) : [...old, r._id],
              )
            }
          >{`${state.snapshot!.records.find((h) => h._id === r.hotelId)?.title || ''} · ${r.title}`}</Action>
        ))}
      </Row>
      <Field
        label={en ? 'Due date (ISO)' : 'Határidő (ISO)'}
        value={dueAt}
        onChangeText={setDueAt}
      />
      <Action
        disabled={!ids.length || state.busy || (!!dueAt && !Number.isFinite(Date.parse(dueAt)))}
        onPress={() =>
          void state.run(async () => {
            const result = await state.request<string[]>(
              `/records/${item._id}/distribute`,
              'POST',
              { locationIds: ids, dueAt: dueAt ? new Date(dueAt).toISOString() : '', requestId },
            );
            setNotice(
              en ? `${result.length} work items created.` : `${result.length} munkalap létrehozva.`,
            );
            setIds([]);
            setRequestId(`routine-${Date.now()}-${Math.random().toString(36).slice(2)}`);
          })
        }
      >
        {en ? 'Distribute work' : 'Munkák kiadása'}
      </Action>
      {!!notice && <Label>{notice}</Label>}
    </Panel>
  );
}
