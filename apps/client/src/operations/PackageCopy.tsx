import { useState } from 'react';
import { Action, Field, Label, Panel } from '../design-system/components';
import { DateField } from '../design-system/date-field';
import type { Item } from './types';
import type { WorkspaceState } from './use-workspace';

export function PackageCopy({
  item,
  state,
  en,
  onOpen,
}: {
  item: Item;
  state: WorkspaceState;
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const [title, setTitle] = useState(`${item.title} · ${en ? 'copy' : 'másolat'}`);
  const [start, setStart] = useState('');
  const [requestId] = useState(
    () => `package-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  return (
    <Panel>
      <Label strong size={18}>
        {en ? 'Reuse this event package' : 'Rendezvénycsomag újrahasználása'}
      </Label>
      <Label muted>
        {en
          ? 'Copies the event and its departmental work. Deadlines move with the new start date; completed checks start empty.'
          : 'Lemásolja a rendezvényt és a részlegek munkalapjait. A határidők az új kezdéshez igazodnak, a pipák üresen indulnak.'}
      </Label>
      <Field
        label={en ? 'New event name' : 'Új rendezvény neve'}
        value={title}
        onChangeText={setTitle}
      />
      <DateField label={en ? 'New start' : 'Új kezdés'} value={start} onChange={setStart} en={en} />
      <Action
        disabled={state.busy || !title.trim() || !Number.isFinite(Date.parse(start))}
        onPress={() =>
          void state.run(async () => {
            const ids = await state.request<string[]>(`/records/${item._id}/copy-package`, 'POST', {
              title,
              startsAt: new Date(start).toISOString(),
              requestId,
            });
            onOpen(ids[0]);
          })
        }
      >
        {en ? 'Create event package' : 'Rendezvénycsomag létrehozása'}
      </Action>
    </Panel>
  );
}
