import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Action } from './components';
import { spacing } from './tokens';

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.md }}>
      <Action secondary onPress={() => setOpen(!open)}>{`${open ? '−' : '+'} ${title}`}</Action>
      {open && children}
    </View>
  );
}
