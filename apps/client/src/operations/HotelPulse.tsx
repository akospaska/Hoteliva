import { Pressable, View } from 'react-native';
import { Badge, Label, Panel, Row } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { displayLabel } from './modules';
import type { Item } from './types';
import { useClock } from './use-clock';

export function HotelPulse({
  records,
  en,
  onOpen,
}: {
  records: Item[];
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const { colors } = useDesign();
  const now = useClock();
  const today = new Date(now).toDateString();
  const cleaning = records.filter((r) => r.kind === 'cleaning');
  const finished = cleaning.filter(
    (r) => r.data.completedAt && new Date(String(r.data.completedAt)).toDateString() === today,
  );
  const todaysWork = cleaning.filter(
    (r) => new Date(r.dueAt || r.createdAt).toDateString() === today,
  );
  const percent = todaysWork.length
    ? Math.round((100 * todaysWork.filter((r) => r.status === 'done').length) / todaysWork.length)
    : 0;
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const counts = hours.map(
    (hour) =>
      finished.filter((r) => new Date(String(r.data.completedAt)).getHours() === hour).length,
  );
  const peak = Math.max(1, ...counts);
  const focus = records
    .filter(
      (r) =>
        ['review', 'blocked'].includes(r.status) ||
        (r.priority === 'urgent' && !['done', 'cancelled'].includes(r.status)),
    )
    .slice(0, 4);
  const rooms = records
    .filter((r) => r.kind === 'location' && r.data.type === 'room')
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }))
    .slice(0, 12);
  return (
    <View style={{ gap: 20 }}>
      <Row style={{ alignItems: 'stretch' }}>
        <Panel style={{ flex: 1, minWidth: 260 }}>
          <Label strong size={18}>
            {en ? 'The rhythm of your hotel' : 'A hotel ritmusa'}
          </Label>
          <Row>
            <Label size={38}>{percent}%</Label>
            <Label muted size={12} style={{ flex: 1 }}>
              {en ? 'Today’s scheduled cleaning approved' : 'Mai esedékes takarítások jóváhagyva'}
            </Label>
          </Row>
          <View
            accessibilityLabel={
              en ? 'Completed cleaning by hour' : 'Elkészült takarítások óránként'
            }
            style={{ height: 140, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}
          >
            {counts.map((count, i) => (
              <View key={i} style={{ flex: 1, gap: 7, alignItems: 'center' }}>
                <View
                  style={{
                    height: Math.max(3, (count / peak) * 100),
                    width: '100%',
                    backgroundColor: count ? colors.primary : colors.soft,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <Label muted size={10}>
                  {hours[i]}
                </Label>
              </View>
            ))}
          </View>
          <Label muted size={10}>
            {en
              ? 'Completed work per hour · local device time'
              : 'Elkészült munkák óránként · eszköz helyi ideje'}
          </Label>
        </Panel>
        <Panel style={{ flex: 1, minWidth: 260 }}>
          <Label strong size={18}>
            {en ? 'Worth a look right now' : 'Most érdemes ránézni'}
          </Label>
          {focus.length === 0 && (
            <Label muted>
              {en
                ? 'No urgent items or pending reviews.'
                : 'Nincs sürgős ügy vagy függő ellenőrzés.'}
            </Label>
          )}
          {focus.map((r) => (
            <Pressable
              key={r._id}
              accessibilityRole="button"
              accessibilityLabel={r.title}
              onPress={() => onOpen(r._id)}
              style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderColor: colors.line,
                gap: 8,
              }}
            >
              <Label strong size={13}>
                {r.title}
              </Label>
              <Row>
                <Badge tone="warning">{displayLabel(r.status, en ? 'en' : 'hu')}</Badge>
                <Label muted size={11}>
                  {displayLabel(r.department, en ? 'en' : 'hu')}
                </Label>
              </Row>
            </Pressable>
          ))}
        </Panel>
      </Row>
      <Panel>
        <Label strong size={18}>
          {en ? 'Rooms at a glance' : 'Szobák egy pillantásra'}
        </Label>
        <Row style={{ alignItems: 'stretch' }}>
          {rooms.map((room) => (
            <Pressable
              key={room._id}
              accessibilityRole="button"
              accessibilityLabel={room.title}
              onPress={() => onOpen(room._id)}
              style={{
                flexGrow: 1,
                flexBasis: 135,
                minWidth: 115,
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.line,
                gap: 12,
              }}
            >
              <Label size={24}>{room.title.split(' · ')[0]}</Label>
              <Label muted size={10}>
                {String(room.data.category || '')}
              </Label>
              <View style={{ height: 1, backgroundColor: colors.line }} />
              <Label size={10}>
                {displayLabel(String(room.data.cleanliness || 'dirty'), en ? 'en' : 'hu')}
              </Label>
            </Pressable>
          ))}
        </Row>
        {!rooms.length && (
          <Label muted>
            {en ? 'Add your first room to get started.' : 'Kezdésként vedd fel az első szobát.'}
          </Label>
        )}
      </Panel>
    </View>
  );
}
