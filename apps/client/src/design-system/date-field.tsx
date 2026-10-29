import { View } from 'react-native';
import { Action, Field, Row } from './components';

export function DateField({
  label,
  value,
  onChange,
  en,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  en: boolean;
}) {
  let display = value;
  if (value.includes('T') && Number.isFinite(Date.parse(value))) {
    const date = new Date(value);
    display = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return (
    <View style={{ gap: 8 }}>
      <Field label={label} value={display} onChangeText={onChange} placeholder="2026-11-15 14:00" />
      <Row>
        <Action
          secondary
          compact
          onPress={() => onChange(new Date(Date.now() + 3600000).toISOString())}
        >
          {en ? 'In 1 hour' : '1 óra múlva'}
        </Action>
        <Action
          secondary
          compact
          onPress={() => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            date.setHours(9, 0, 0, 0);
            onChange(date.toISOString());
          }}
        >
          {en ? 'Tomorrow 09:00' : 'Holnap 09:00'}
        </Action>
        <Action secondary compact onPress={() => onChange('')}>
          {en ? 'Clear' : 'Törlés'}
        </Action>
      </Row>
    </View>
  );
}
