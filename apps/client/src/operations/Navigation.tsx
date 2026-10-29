import { Brand } from '../design-system/legacy-ui';
import { ScrollView, Pressable, View } from 'react-native';
import { Label } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { layout } from '../design-system/tokens';
import { modules } from './modules';

export function Navigation({
  selected,
  en,
  mobile = false,
  onSelect,
}: {
  selected: string;
  en: boolean;
  mobile?: boolean;
  onSelect: (id: string) => void;
}) {
  const { colors } = useDesign();
  return (
    <View
      style={{
        width: mobile ? '100%' : layout.sidebar,
        backgroundColor: colors.rail,
        ...(mobile ? { flex: 1 } : {}),
      }}
    >
      <View style={{ padding: 28 }}>
        <Brand light />
        <Label size={10} style={{ color: colors.railMuted }}>
          {en ? 'A BETTER DAY, TOGETHER' : 'EGYÜTT GÖRDÜLÉKENYEBB'}
        </Label>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24, gap: 4 }}>
        {modules.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={en ? m.en : m.hu}
            accessibilityState={{ selected: selected === m.id }}
            onPress={() => onSelect(m.id)}
            style={({ pressed }) => ({
              paddingVertical: 13,
              paddingHorizontal: 14,
              borderRadius: 8,
              flexDirection: 'row',
              gap: 12,
              backgroundColor:
                selected === m.id ? colors.accent : pressed ? '#FFFFFF12' : 'transparent',
            })}
          >
            <Label
              size={15}
              style={{ color: selected === m.id ? colors.onAccent : colors.railMuted }}
            >
              {m.icon}
            </Label>
            <Label
              size={11}
              strong={selected === m.id}
              style={{ color: selected === m.id ? colors.onAccent : colors.onRail, flex: 1 }}
            >
              {en ? m.en : m.hu}
            </Label>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
