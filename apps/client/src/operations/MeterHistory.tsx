import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Label, Panel, Row } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import type { Activity, Detail, Item } from './types';
import type { WorkspaceState } from './use-workspace';

export function MeterHistory({
  item,
  state,
  en,
}: {
  item: Item;
  state: WorkspaceState;
  en: boolean;
}) {
  const [readings, setReadings] = useState<Activity[]>([]);
  const { request, setError } = state;
  const { colors } = useDesign();
  useEffect(() => {
    let alive = true;
    void request<Detail>(`/records/${item._id}`)
      .then((d) => {
        if (alive) setReadings(d.activities.filter((a) => a.type === 'reading').slice(-12));
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [item._id, item.version, request, setError]);
  if (!readings.length) return null;
  const peak = Math.max(1, ...readings.map((a) => Number(a.snapshot?.data.meterValue || 0)));
  return (
    <Panel>
      <Label strong size={18}>
        {en ? 'Meter reading history' : 'Mérőállások alakulása'}
      </Label>
      <Label muted size={11}>
        {en
          ? 'Up to 12 readings from the latest 100 activity entries. Older readings remain in the activity history.'
          : 'Legfeljebb 12 mérés az utolsó 100 eseményből. A korábbi mérések az előzményekben visszakereshetők.'}
      </Label>
      {readings.map((reading, index) => {
        const value = Number(reading.snapshot?.data.meterValue || 0);
        const previous = index
          ? Number(readings[index - 1].snapshot?.data.meterValue || 0)
          : undefined;
        const difference = previous === undefined ? null : value - previous;
        return (
          <View key={reading._id} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label size={12}>
                {new Date(reading.createdAt).toLocaleString(en ? 'en-GB' : 'hu-HU')}
              </Label>
              <Label strong size={12}>
                {value} {String(item.data.meterUnit || '')}
              </Label>
            </Row>
            <View style={{ height: 8, backgroundColor: colors.soft, borderRadius: 4 }}>
              <View
                style={{
                  height: 8,
                  width: `${(value / peak) * 100}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                }}
              />
            </View>
            {difference !== null && (
              <Label muted size={11}>
                {difference < 0
                  ? en
                    ? 'Meter reset / correction'
                    : 'Mérőcsere / korrekció'
                  : `+${difference} ${String(item.data.meterUnit || '')}`}
              </Label>
            )}
            {!!reading.text && (
              <Label muted size={11}>
                {reading.text}
              </Label>
            )}
          </View>
        );
      })}
    </Panel>
  );
}
