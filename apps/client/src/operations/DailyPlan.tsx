import { useState } from 'react';
import { Action, Field, Label, Panel } from '../design-system/components';
import type { WorkspaceState } from './use-workspace';
import { Disclosure } from '../design-system/disclosure';

export function DailyPlan({
  state,
  en,
  hotelId,
}: {
  state: WorkspaceState;
  en: boolean;
  hotelId: string;
}) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [notice, setNotice] = useState('');
  return (
    <Disclosure title={en ? 'Daily cleaning plan' : 'Napi takarítási terv'}>
      <Panel>
        <Label strong size={18}>
          {en ? 'Daily cleaning plan' : 'Napi takarítási terv'}
        </Label>
        <Label muted>
          {en
            ? 'Uses room category, occupancy, VIP status, linen interval and matching templates. Do not disturb and declined cleaning create blocked work. The default deadline is 15:00 in the hotel time zone.'
            : 'A szobakategória, foglaltság, VIP-jelzés, ágyneműcsere-intervallum és a hozzáillő sablon alapján készül. A „Ne zavarjanak” és az elutasított takarítás elakadt munkaként jelenik meg. Alapértelmezett határidő: 15:00 a hotel időzónájában.'}
        </Label>
        <Field
          label={en ? 'Planning date (YYYY-MM-DD)' : 'Tervezés napja (ÉÉÉÉ-HH-NN)'}
          value={date}
          onChangeText={setDate}
        />
        <Action
          disabled={!hotelId || state.busy || !/^\d{4}-\d{2}-\d{2}$/.test(date)}
          onPress={() =>
            void state.run(async () => {
              const ids = await state.request<string[]>('/cleaning-plan', 'POST', {
                hotelId,
                date,
              });
              setNotice(
                en
                  ? `${ids.length} work items in the daily plan.`
                  : `${ids.length} munkalap a napi tervben.`,
              );
            })
          }
        >
          {en ? 'Prepare daily plan' : 'Napi terv összeállítása'}
        </Action>
        {!hotelId && <Label muted>{en ? 'Select a hotel first.' : 'Előbb válassz hotelt.'}</Label>}
        {!!notice && <Label>{notice}</Label>}
      </Panel>
    </Disclosure>
  );
}
