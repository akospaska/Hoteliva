import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Action, Label, Panel, Row } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { radii, spacing } from '../design-system/tokens';
import { displayLabel } from './modules';
import type { Item } from './types';

export function RoomBoard({
  rooms,
  en,
  onOpen,
}: {
  rooms: Item[];
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const { colors } = useDesign();
  const [floor, setFloor] = useState('');
  const [width, setWidth] = useState(300);
  const [limit, setLimit] = useState(60);
  const floors = [...new Set(rooms.map((r) => String(r.data.floor || '')).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true }),
  );
  const filtered = rooms
    .filter((r) => !floor || String(r.data.floor) === floor)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  const columns = width >= 800 ? 6 : width >= 550 ? 4 : 3;
  return (
    <View style={{ gap: spacing.md }}>
      <Row>
        <Action compact secondary={!!floor} onPress={() => setFloor('')}>
          {en ? 'All locations' : 'Összes helyszín'}
        </Action>
        {floors.map((f) => (
          <Action key={f} compact secondary={floor !== f} onPress={() => setFloor(f)}>
            {en ? `Floor ${f}` : `${f}. emelet`}
          </Action>
        ))}
      </Row>
      <Panel style={{ padding: spacing.md }}>
        <Label strong>{en ? 'Rooms & locations' : 'Szobák és helyszínek'}</Label>
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -spacing.xs }}
        >
          {filtered.slice(0, limit).map((room) => {
            const status = String(room.data.cleanliness || room.status);
            const blocked = room.data.maintenance === 'blocked';
            const tone = blocked
              ? colors.danger
              : status === 'clean'
                ? colors.primary
                : status === 'review'
                  ? colors.warning
                  : colors.muted;
            return (
              <View key={room._id} style={{ width: `${100 / columns}%`, padding: spacing.xs }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={room.title}
                  onPress={() => onOpen(room._id)}
                  style={({ pressed }) => ({
                    borderWidth: 1,
                    borderColor: blocked ? colors.danger : colors.line,
                    borderRadius: radii.control,
                    padding: spacing.md,
                    gap: spacing.sm,
                    backgroundColor: pressed ? colors.soft : colors.surface,
                    minHeight: 130,
                  })}
                >
                  <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <Label size={22} numberOfLines={1} style={{ flex: 1 }}>
                      {room.title.split(' · ')[0]}
                    </Label>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: radii.round,
                        backgroundColor: tone,
                      }}
                    />
                  </Row>
                  <Label muted size={10} numberOfLines={1}>
                    {String(
                      room.data.category ||
                        displayLabel(String(room.data.type || 'room'), en ? 'en' : 'hu'),
                    )}
                  </Label>
                  <View style={{ height: 1, backgroundColor: colors.line }} />
                  <Label size={10} style={{ color: tone }}>
                    {blocked
                      ? en
                        ? 'Out of service'
                        : 'Nem kiadható'
                      : displayLabel(status, en ? 'en' : 'hu')}
                  </Label>
                  {['dnd', 'skip', 'vip'].includes(String(room.data.service)) && (
                    <Label size={10} style={{ color: colors.warning }}>
                      {displayLabel(String(room.data.service), en ? 'en' : 'hu')}
                    </Label>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        {!filtered.length && (
          <Label muted>
            {en ? 'No locations match the filter.' : 'Nincs a szűrésnek megfelelő helyszín.'}
          </Label>
        )}
        {filtered.length > limit && (
          <Action secondary onPress={() => setLimit(limit + 60)}>
            {en ? 'Show more locations' : 'További helyszínek'}
          </Action>
        )}
      </Panel>
    </View>
  );
}
