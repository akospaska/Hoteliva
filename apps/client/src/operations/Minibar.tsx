import { useState } from 'react';
import { View } from 'react-native';
import { Action, Badge, Field, Label, Panel, Row, Select } from '../design-system/components';
import type { WorkspaceState } from './use-workspace';

export function Minibar({
  state,
  en,
  hotelId,
  locationId = '',
}: {
  state: WorkspaceState;
  en: boolean;
  hotelId: string;
  locationId?: string;
}) {
  const [roomId, setRoomId] = useState(locationId);
  const [lines, setLines] = useState<Record<string, number>>({});
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState('');
  const [requestId, setRequestId] = useState(
    () => `minibar-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const t = (hu: string, english: string) => (en ? english : hu);
  const room = state.snapshot!.records.find((r) => r._id === roomId);
  const products = state.snapshot!.records.filter(
    (r) =>
      r.kind === 'product' && r.status === 'active' && r.hotelId === (room?.hotelId || hotelId),
  );
  const update = (id: string, delta: number) => {
    setLines((old) => ({ ...old, [id]: Math.max(0, Math.min(100, (old[id] || 0) + delta)) }));
    setReceipt('');
  };
  return (
    <Panel>
      <Label strong size={22}>
        {t('Minibárfogyasztás rögzítése', 'Record minibar consumption')}
      </Label>
      {!locationId && (
        <Select
          label={t('Szoba', 'Room')}
          value={roomId}
          options={state
            .snapshot!.records.filter(
              (r) =>
                r.kind === 'location' &&
                r.data.type === 'room' &&
                (!hotelId || r.hotelId === hotelId),
            )
            .map((r) => ({ value: r._id, label: r.title }))}
          onChange={(id) => {
            setRoomId(id);
            setLines({});
          }}
        />
      )}
      {products.map((product) => (
        <Row key={product._id} style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Label strong>{product.title}</Label>
            <Label
              muted
              size={12}
            >{`${product.data.price || 0} ${product.data.currency || 'HUF'}`}</Label>
          </View>
          <Action
            secondary
            disabled={state.busy || !lines[product._id]}
            onPress={() => update(product._id, -1)}
            accessibilityLabel={`${product.title} −`}
          >
            −
          </Action>
          <Badge>{String(lines[product._id] || 0)}</Badge>
          <Action
            secondary
            disabled={state.busy}
            onPress={() => update(product._id, 1)}
            accessibilityLabel={`${product.title} +`}
          >
            +
          </Action>
        </Row>
      ))}
      {products.length === 0 && (
        <Label muted>
          {t(
            'A hotelhez előbb terméklistát kell felvenni.',
            'Add a product catalog for this hotel first.',
          )}
        </Label>
      )}
      <Field
        label={t('Tartózkodás / elszámolás azonosítója', 'Stay / billing reference')}
        value={reference}
        onChangeText={setReference}
      />
      <Label muted size={12}>
        {t(
          'A fogyasztást a recepción lehet feldolgozni. Automatikus számlaterhelés nincs bekapcsolva.',
          'Front office can process recorded consumption. Automatic billing is not connected.',
        )}
      </Label>
      <Action
        disabled={!roomId || !Object.values(lines).some((q) => q > 0) || state.busy}
        onPress={() =>
          void state.run(async () => {
            await state.request('/minibar', 'POST', {
              locationId: roomId,
              requestId,
              stayReference: reference,
              lines: Object.entries(lines)
                .filter(([, quantity]) => quantity > 0)
                .map(([productId, quantity]) => ({ productId, quantity })),
            });
            setReceipt(t('Fogyasztás rögzítve.', 'Consumption recorded.'));
            setLines({});
            setRequestId(`minibar-${Date.now()}-${Math.random().toString(36).slice(2)}`);
          })
        }
      >
        {t('Fogyasztás mentése', 'Save consumption')}
      </Action>
      {!!receipt && <Label>{receipt}</Label>}
    </Panel>
  );
}
