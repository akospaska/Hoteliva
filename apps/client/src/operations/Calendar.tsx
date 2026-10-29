import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Action, Badge, Label, Panel, Row } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import type { Item } from './types';

export function Calendar({
  records,
  en,
  onOpen,
}: {
  records: Item[];
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const { colors } = useDesign();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState('');
  const key = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const events = records.filter(
    (r) => r.kind === 'event' && r.data.startsAt && r.status !== 'cancelled',
  );
  const start = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const daily = events.filter((r) => key(new Date(String(r.data.startsAt))) === selected);
  return (
    <Panel>
      <Row style={{ justifyContent: 'space-between' }}>
        <Action
          secondary
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          ←
        </Action>
        <Label strong size={18}>
          {month.toLocaleDateString(en ? 'en-GB' : 'hu-HU', { month: 'long', year: 'numeric' })}
        </Label>
        <Action
          secondary
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          →
        </Action>
      </Row>
      <Row style={{ gap: 0 }}>
        {(en
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          : ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']
        ).map((d) => (
          <View key={d} style={{ width: `${100 / 7}%`, alignItems: 'center', padding: 8 }}>
            <Label muted size={11}>
              {d}
            </Label>
          </View>
        ))}
        {Array.from({ length: start + days }, (_, i) => {
          const day = i - start + 1;
          const date = key(new Date(month.getFullYear(), month.getMonth(), day));
          const count = events.filter(
            (r) => key(new Date(String(r.data.startsAt))) === date,
          ).length;
          return (
            <Pressable
              key={i}
              disabled={day < 1}
              accessibilityRole="button"
              accessibilityLabel={date}
              onPress={() => setSelected(date)}
              style={{
                width: `${100 / 7}%`,
                minHeight: 54,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: selected === date ? colors.soft : 'transparent',
              }}
            >
              <Label strong={count > 0}>{day > 0 ? day : ''}</Label>
              {day > 0 && count > 0 && (
                <Label size={9} style={{ color: colors.primary }}>
                  ●
                </Label>
              )}
            </Pressable>
          );
        })}
      </Row>
      {!!selected && (
        <>
          <Label strong>{selected}</Label>
          {daily.length === 0 && (
            <Label muted>{en ? 'No events on this day.' : 'Erre a napra nincs esemény.'}</Label>
          )}
          {daily.map((event) => (
            <Action
              key={event._id}
              secondary
              onPress={() => onOpen(event._id)}
            >{`${new Date(String(event.data.startsAt)).toLocaleTimeString(en ? 'en-GB' : 'hu-HU', { hour: '2-digit', minute: '2-digit' })} · ${event.title}`}</Action>
          ))}
        </>
      )}
      <Badge>{en ? `${events.length} events` : `${events.length} esemény`}</Badge>
    </Panel>
  );
}
