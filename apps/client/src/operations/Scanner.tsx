import { useState } from 'react';
import { Modal, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Action, Field, Label, Panel } from '../design-system/components';

export const qrToken = (value: string) => {
  try {
    return new URL(value).searchParams.get('qr') || value;
  } catch {
    return value.trim();
  }
};
export function Scanner({
  en,
  onScan,
  onClose,
}: {
  en: boolean;
  onScan: (token: string) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const accept = (data: string) => {
    if (done) return;
    setDone(true);
    onScan(qrToken(data));
  };
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Panel>
          <Label strong size={22}>
            {en ? 'Scan a room or checkpoint' : 'Szoba vagy ellenőrzőpont beolvasása'}
          </Label>
          {permission?.granted ? (
            <CameraView
              style={{ height: 300 }}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={done ? undefined : ({ data }) => accept(data)}
            />
          ) : (
            <Action onPress={() => void requestPermission()}>
              {en ? 'Enable camera' : 'Kamera engedélyezése'}
            </Action>
          )}
          <Field
            label={en ? 'QR link (manual entry)' : 'QR-link (kézi bevitel)'}
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
          />
          <Action disabled={!value.trim()} onPress={() => accept(value)}>
            {en ? 'Open' : 'Megnyitás'}
          </Action>
          <Action secondary onPress={onClose}>
            {en ? 'Close' : 'Bezárás'}
          </Action>
        </Panel>
      </View>
    </Modal>
  );
}
