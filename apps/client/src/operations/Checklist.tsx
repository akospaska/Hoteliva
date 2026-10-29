import { useState } from 'react';
import { View } from 'react-native';
import { Action, Badge, Field, Label, Panel, Row } from '../design-system/components';
import type { Check, Item, ItemInput } from './types';
import type { WorkspaceState } from './use-workspace';
import { Scanner } from './Scanner';
import { CheckEvidence } from './CheckEvidence';

function CheckRow({
  check,
  item,
  state,
  en,
  onCreate,
}: {
  check: Check;
  item: Item;
  state: WorkspaceState;
  en: boolean;
  onCreate: (kind: string, input?: Partial<ItemInput>) => void;
}) {
  const [value, setValue] = useState(String(check.value ?? ''));
  const [reason, setReason] = useState('');
  const [scanner, setScanner] = useState(false);
  const ctx = state.snapshot!.context!;
  const editable =
    !['done', 'cancelled'].includes(item.status) &&
    (ctx.manager ||
      ctx.permissions.includes(`${item.kind}:manage`) ||
      item.assigneeId === ctx.userId);
  return (
    <View style={{ gap: 12 }}>
      <Row>
        <Badge tone={check.reason ? 'warning' : 'normal'}>
          {!!check.completedAt && !check.reason ? '✓' : '○'}
        </Badge>
        <Label strong>
          {check.label}
          {check.required ? ' *' : ''}
        </Label>
      </Row>
      {check.completedAt ? (
        <Label muted size={11}>
          {new Date(check.completedAt).toLocaleString(en ? 'en-GB' : 'hu-HU')} ·{' '}
          {String(check.value ?? '')} {check.reason}
        </Label>
      ) : null}
      {!!check.locationId && (
        <Action secondary disabled={state.busy || !editable} onPress={() => setScanner(true)}>
          {check.scannedAt
            ? en
              ? 'Checkpoint scanned ✓'
              : 'Ellenőrzőpont beolvasva ✓'
            : en
              ? 'Scan checkpoint'
              : 'Ellenőrzőpont beolvasása'}
        </Action>
      )}
      <CheckEvidence {...{ check, item, state, en }} />
      {!['check', 'photo'].includes(check.type) && (
        <Field
          label={en ? 'Value' : 'Érték'}
          keyboardType={check.type === 'number' ? 'numeric' : 'default'}
          value={value}
          onChangeText={setValue}
          editable={editable}
        />
      )}
      {check.type !== 'photo' && (
        <Row>
          <Action
            disabled={
              state.busy ||
              !editable ||
              (!!check.locationId && !check.scannedAt) ||
              (check.type === 'number' && !value.trim())
            }
            onPress={() =>
              void state.act(item, 'check', {
                checkId: check.id,
                value:
                  check.type === 'check' ? true : check.type === 'number' ? Number(value) : value,
              })
            }
          >
            {en ? 'Confirm check' : 'Ellenőrzés rögzítése'}
          </Action>
        </Row>
      )}
      <Field
        label={en ? 'Reason if unable to complete' : 'Indoklás, ha nem végezhető el'}
        value={reason}
        onChangeText={setReason}
        editable={editable}
      />
      {!!reason && (
        <Action
          secondary
          disabled={state.busy || !editable}
          onPress={() => void state.act(item, 'check', { checkId: check.id, text: reason })}
        >
          {en ? 'Report exception' : 'Kivétel jelentése'}
        </Action>
      )}
      {(ctx.manager || ctx.permissions.includes('task:create')) && (
        <Action
          secondary
          onPress={() =>
            onCreate('task', {
              title: check.label,
              description: `${item.title}\n${check.label}${reason || check.reason ? `\n${reason || check.reason}` : ''}`,
              hotelId: item.hotelId,
              locationId: check.locationId || item.locationId,
              parentId: item._id,
              department: 'maintenance',
            })
          }
        >
          {en ? 'Report a fault for this check' : 'Hibabejelentés erről a pontról'}
        </Action>
      )}
      {!!scanner && (
        <Scanner
          en={en}
          onClose={() => setScanner(false)}
          onScan={(qrToken) => {
            setScanner(false);
            void state.act(item, 'scan', { checkId: check.id, qrToken });
          }}
        />
      )}
    </View>
  );
}
export function Checklist({
  item,
  state,
  en,
  onCreate,
}: {
  item: Item;
  state: WorkspaceState;
  en: boolean;
  onCreate: (kind: string, input?: Partial<ItemInput>) => void;
}) {
  if (!item.checks.length) return null;
  const completed = item.checks.filter((c) => c.completedAt && !c.reason).length;
  return (
    <Panel>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label strong size={18}>
          {en ? 'Checklist' : 'Ellenőrzőlista'}
        </Label>
        <Badge>{`${completed}/${item.checks.length}`}</Badge>
      </Row>
      {item.checks.map((check) => (
        <CheckRow
          key={`${check.id}-${check.completedAt || ''}`}
          {...{ check, item, state, en, onCreate }}
        />
      ))}
    </Panel>
  );
}
