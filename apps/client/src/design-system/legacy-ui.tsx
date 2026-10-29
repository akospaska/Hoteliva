import { View } from 'react-native';
import type { Locale } from '../lib/translations';
import { Action, Field, Label, Row } from './components';
import { useDesign } from './theme';
export { Field };
export function Brand({ light = false }: { light?: boolean }) {
  const { colors } = useDesign();
  return (
    <Row>
      <View
        style={{
          width: 38,
          height: 38,
          backgroundColor: colors.accent,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Label strong size={27} style={{ color: colors.onAccent }}>
          h.
        </Label>
      </View>
      <Label strong size={25} style={{ color: light ? colors.onRail : colors.ink }}>
        hoteliva
      </Label>
    </Row>
  );
}
export function LanguageSwitch({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <Row>
      {(['hu', 'en'] as const).map((value) => (
        <Action
          key={value}
          compact
          secondary={value !== locale}
          accessibilityLabel={value === 'hu' ? 'Magyar' : 'English'}
          onPress={() => onChange(value)}
        >
          {value.toUpperCase()}
        </Action>
      ))}
    </Row>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Action onPress={onPress} disabled={disabled} secondary={secondary}>
      {title}
    </Action>
  );
}
