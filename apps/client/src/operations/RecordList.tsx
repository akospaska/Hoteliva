import { useClock } from './use-clock';
import { Pressable, View } from 'react-native';
import { Badge, Label, Panel, Row } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { displayLabel, kindLabel } from './modules';
import type { Item, Snapshot } from './types';

export function RecordList({
  items,
  snapshot,
  en,
  rooms = false,
  onOpen,
}: {
  items: Item[];
  snapshot: Snapshot;
  en: boolean;
  rooms?: boolean;
  onOpen: (id: string) => void;
}) {
  const now = useClock();
  const { colors } = useDesign();
  if (!items.length)
    return (
      <Panel>
        <Label strong size={20}>
          {en ? 'Everything starts with the first item.' : 'Minden az első bejegyzéssel kezdődik.'}
        </Label>
        <Label muted>
          {en
            ? 'Create an item, or adjust your filters.'
            : 'Hozz létre egy bejegyzést, vagy módosítsd a szűrőket.'}
        </Label>
      </Panel>
    );
  return (
    <View
      style={{ flexDirection: rooms ? 'row' : 'column', flexWrap: 'wrap', gap: rooms ? 16 : 8 }}
    >
      {items.map((item) => (
        <Pressable
          key={item._id}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={() => onOpen(item._id)}
          style={({ pressed }) => ({
            ...(rooms ? { flexGrow: 1, flexBasis: 210, maxWidth: 350 } : { width: '100%' }),
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Panel
            style={{
              padding: 20,
              gap: 12,
              borderLeftWidth: item.priority === 'urgent' ? 4 : 1,
              borderLeftColor: item.priority === 'urgent' ? colors.danger : colors.line,
            }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Label strong size={rooms ? 24 : 15}>
                {item.title}
              </Label>
              <Badge
                tone={
                  item.status === 'blocked'
                    ? 'danger'
                    : item.status === 'review'
                      ? 'warning'
                      : 'normal'
                }
              >
                {displayLabel(
                  item.data.cleanliness ? String(item.data.cleanliness) : item.status,
                  en ? 'en' : 'hu',
                )}
              </Badge>
            </Row>
            <Label muted size={12} numberOfLines={2}>
              {item.description ||
                (item.kind === 'location'
                  ? [item.data.floor, item.data.category].filter(Boolean).join(' · ')
                  : kindLabel(item.kind, en ? 'en' : 'hu'))}
            </Label>
            <Row>
              {!!item.locationId && (
                <Badge>
                  {snapshot.records.find((r) => r._id === item.locationId)?.title || '—'}
                </Badge>
              )}
              {!!item.department && (
                <Label muted size={11}>
                  {displayLabel(item.department, en ? 'en' : 'hu')}
                </Label>
              )}
              {!!item.assigneeId && (
                <Label muted size={11}>
                  {snapshot.people.find((p) => p._id === item.assigneeId)?.name || '—'}
                </Label>
              )}
              {!!item.dueAt && (
                <Label
                  size={11}
                  style={{
                    color:
                      Date.parse(item.dueAt) < now && !['done', 'cancelled'].includes(item.status)
                        ? colors.danger
                        : colors.muted,
                  }}
                >
                  {new Date(item.dueAt).toLocaleDateString(en ? 'en-GB' : 'hu-HU')}
                </Label>
              )}
              {!!item.data.service && item.data.service !== 'normal' && (
                <Badge tone="warning">
                  {displayLabel(String(item.data.service), en ? 'en' : 'hu')}
                </Badge>
              )}
              {item.data.quantity !== undefined && (
                <Badge>{`${item.data.quantity} ${item.data.unit || ''}`}</Badge>
              )}
              {item.kind === 'stock' &&
                Number(item.data.quantity) < Number(item.data.minimum || 0) && (
                  <Badge tone="warning">
                    {en ? 'Replenishment needed' : 'Utánpótlás szükséges'}
                  </Badge>
                )}
            </Row>
            {item.checks.length > 0 && (
              <Label muted size={11}>
                {item.checks.filter((c) => c.completedAt && !c.reason).length}/{item.checks.length}{' '}
                {en ? 'checks complete' : 'ellenőrzés kész'}
              </Label>
            )}
          </Panel>
        </Pressable>
      ))}
    </View>
  );
}
