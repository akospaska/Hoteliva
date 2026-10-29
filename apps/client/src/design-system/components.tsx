import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useDesign } from './theme';
import { radii, typography as type, spacing as space, layout } from './tokens';

export function Label({
  children,
  size = type.body,
  muted = false,
  strong = false,
  style,
  ...props
}: {
  children?: ReactNode;
  size?: number;
  muted?: boolean;
  strong?: boolean;
  style?: object;
  accessibilityRole?: 'header' | 'alert';
  numberOfLines?: number;
}) {
  const { colors } = useDesign();
  return (
    <Text
      {...props}
      style={[
        {
          color: muted ? colors.muted : colors.ink,
          fontSize: size,
          fontFamily: strong ? type.strong : type.regular,
          lineHeight: size * 1.5,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useDesign();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radii.panel,
          padding: space.xl,
          gap: space.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Action({
  children,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  busy = false,
  compact = false,
  testID,
  accessibilityLabel,
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const { colors } = useDesign();
  const color = danger ? colors.danger : secondary ? colors.ink : colors.onPrimary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: layout.touch,
        paddingHorizontal: compact ? 12 : 18,
        paddingVertical: 10,
        borderRadius: radii.control,
        borderWidth: secondary || danger ? 1 : 0,
        borderColor: danger ? colors.danger : colors.line,
        backgroundColor: secondary || danger ? colors.surface : colors.primary,
        opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      })}
    >
      {busy && <ActivityIndicator size="small" color={color} />}
      <Label strong size={compact ? 11 : 12} style={{ color, textAlign: 'center' }}>
        {children}
      </Label>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useDesign();
  return (
    <View style={{ gap: 8 }}>
      <Label muted size={12}>
        {label}
      </Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          {
            color: colors.ink,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radii.control,
            padding: 14,
            minHeight: layout.touch,
            fontFamily: type.regular,
            fontSize: 14,
            ...(props.multiline ? { minHeight: 110, textAlignVertical: 'top' as const } : {}),
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Badge({
  children,
  tone = 'normal',
}: {
  children: string;
  tone?: 'normal' | 'warning' | 'danger';
}) {
  const { colors } = useDesign();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: radii.chip,
        backgroundColor:
          tone === 'danger'
            ? colors.dangerSoft
            : tone === 'warning'
              ? colors.warningSoft
              : colors.soft,
      }}
    >
      <Label
        size={10}
        strong
        style={{
          color:
            tone === 'danger'
              ? colors.danger
              : tone === 'warning'
                ? colors.warning
                : colors.primary,
        }}
      >
        {children}
      </Label>
    </View>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
  empty = '—',
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  empty?: string;
}) {
  const { colors } = useDesign();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  return (
    <View style={{ gap: 8 }}>
      <Label muted size={12}>
        {label}
      </Label>
      <Action
        secondary
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
      >{`${options.find((o) => o.value === value)?.label || empty}  ▾`}</Action>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          style={{ flex: 1, backgroundColor: '#07180FCC', justifyContent: 'center', padding: 24 }}
        >
          <Panel style={{ maxHeight: '85%', width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <Label strong size={20}>
              {label}
            </Label>
            <TextInput
              accessibilityLabel={label}
              placeholder={label}
              value={query}
              onChangeText={setQuery}
              style={{
                minHeight: 44,
                borderWidth: 1,
                borderColor: colors.line,
                color: colors.ink,
                padding: 12,
              }}
            />
            <ScrollView keyboardShouldPersistTaps="handled">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={{ padding: 14 }}
              >
                <Label>{empty}</Label>
              </Pressable>
              {options
                .filter((o) => o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
                .map((o) => (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={{
                      padding: 14,
                      borderTopWidth: 1,
                      borderColor: colors.line,
                      backgroundColor: o.value === value ? colors.soft : colors.surface,
                    }}
                  >
                    <Label>{o.label}</Label>
                  </Pressable>
                ))}
            </ScrollView>
            <Action secondary onPress={() => setOpen(false)}>
              ×
            </Action>
          </Panel>
        </View>
      </Modal>
    </View>
  );
}
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
        style,
      ]}
    >
      {children}
    </View>
  );
}
