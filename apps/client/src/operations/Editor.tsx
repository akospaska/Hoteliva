import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Action, Field, Label, Panel, Row, Select } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { DateField } from '../design-system/date-field';
import { fields, defaults } from './fields';
import { message } from './use-workspace';
import { ReferencePicker } from './ReferencePicker';
import { displayLabel, kindLabel } from './modules';
import type { Check, Item, ItemInput, Snapshot, Value } from './types';

export function Editor({
  kind,
  item,
  initial,
  snapshot,
  en,
  busy,
  onSave,
  onClose,
  issue,
}: {
  kind: string;
  item?: Item;
  initial?: Partial<ItemInput>;
  snapshot: Snapshot;
  en: boolean;
  busy: boolean;
  onSave: (input: ItemInput) => Promise<void>;
  onClose: () => void;
  issue?: string;
}) {
  const { colors } = useDesign();
  const t = (hu: string, english: string) => (en ? english : hu);
  const [input, setInput] = useState<ItemInput>(() => ({
    kind,
    title: '',
    description: '',
    hotelId: '',
    locationId: '',
    department: '',
    assigneeId: '',
    dueAt: '',
    priority: 'normal',
    parentId: '',
    data: defaults(kind) as Record<string, Value>,
    checks: [],
    ...initial,
    ...(item
      ? {
          ...item,
          checks: item.checks.map(({ id, label, type, required, locationId, guideId }) => ({
            id,
            label,
            type,
            required,
            locationId,
            guideId,
          })),
        }
      : {}),
  }));
  const [error, setError] = useState('');
  const update = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) =>
    setInput((old) => ({ ...old, [key]: value }));
  const data = (key: string, value: Value) => update('data', { ...input.data, [key]: value });
  const options = (kind: string) =>
    snapshot.records
      .filter(
        (r) =>
          r.kind === kind && (!input.hotelId || r.hotelId === input.hotelId || kind === 'hotel'),
      )
      .map((r) => ({ value: r._id, label: r.title }));
  const personOptions = snapshot.people.map((p) => ({ value: p._id, label: p.name }));
  const checkUpdate = (index: number, patch: Partial<Check>) =>
    update(
      'checks',
      input.checks.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  async function submit() {
    if (!input.title.trim() || (input.dueAt && !Number.isFinite(Date.parse(input.dueAt)))) {
      setError(t('Cím és érvényes határidő szükséges.', 'Enter a title and valid due date.'));
      return;
    }
    // Send only DTO fields; workflow status and version are managed by the server.
    const {
      kind,
      title,
      description,
      hotelId,
      locationId,
      department,
      assigneeId,
      dueAt,
      priority,
      parentId,
      data,
      checks,
    } = input;
    await onSave({
      kind,
      title,
      description,
      hotelId,
      locationId,
      department,
      assigneeId,
      dueAt: dueAt ? new Date(dueAt).toISOString() : '',
      priority,
      parentId,
      data: Object.fromEntries(
        Object.entries(data).filter(
          ([key]) => key === 'relatedIds' || fields[kind]?.some((f) => f.key === key),
        ),
      ),
      checks,
    });
  }
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 24,
            gap: 20,
            maxWidth: 800,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <Label strong size={24}>
              {item ? t('Szerkesztés', 'Edit') : t('Új', 'New')} ·{' '}
              {kindLabel(kind, en ? 'en' : 'hu')}
            </Label>
            <Action secondary onPress={onClose}>
              {t('Bezárás', 'Close')}
            </Action>
          </Row>
          {error || issue ? (
            <Label accessibilityRole="alert" style={{ color: colors.danger }}>
              {error || message(issue!, en)}
            </Label>
          ) : null}
          <Field
            label={t('Megnevezés', 'Title')}
            value={input.title}
            onChangeText={(v) => update('title', v)}
            maxLength={160}
          />
          <Field
            label={t('Leírás és utasítások', 'Description & instructions')}
            value={input.description}
            onChangeText={(v) => update('description', v)}
            multiline
          />
          {kind !== 'hotel' && (
            <Select
              label={t('Hotel', 'Hotel')}
              value={input.hotelId}
              options={options('hotel')}
              onChange={(v) => {
                setInput((old) => ({ ...old, hotelId: v, locationId: '', assigneeId: '' }));
              }}
            />
          )}
          {!['hotel', 'location'].includes(kind) && (
            <Select
              label={t('Helyszín', 'Location')}
              value={input.locationId}
              options={options('location')}
              onChange={(v) => update('locationId', v)}
            />
          )}
          <Select
            label={t('Részleg', 'Department')}
            value={input.department}
            options={['housekeeping', 'maintenance', 'reception', 'management', 'hr'].map(
              (value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }),
            )}
            onChange={(v) => update('department', v)}
          />
          <Select
            label={t('Felelős', 'Assignee')}
            value={input.assigneeId}
            options={personOptions}
            onChange={(v) => update('assigneeId', v)}
          />
          <Select
            label={t('Prioritás', 'Priority')}
            value={input.priority}
            options={['normal', 'high', 'urgent'].map((value) => ({
              value,
              label: displayLabel(value, en ? 'en' : 'hu'),
            }))}
            onChange={(v) => update('priority', (v || 'normal') as ItemInput['priority'])}
          />
          <DateField
            en={en}
            label={t('Határidő', 'Due date')}
            value={input.dueAt}
            onChange={(v) => update('dueAt', v)}
          />
          {fields[kind]?.map((f) => {
            const label = en ? f.en : f.hu;
            const value = input.data[f.key];
            if (['nextRunAt', 'startsAt', 'endsAt', 'occurredAt'].includes(f.key))
              return (
                <DateField
                  key={f.key}
                  en={en}
                  label={label.replace(' (ISO dátum)', '').replace(' (ISO date)', '')}
                  value={String(value || '')}
                  onChange={(v) => data(f.key, v)}
                />
              );
            if (f.key === 'members')
              return (
                <Panel key={f.key}>
                  <Label strong>{label}</Label>
                  {personOptions.map((p) => (
                    <Action
                      key={p.value}
                      secondary={!Array.isArray(value) || !value.includes(p.value)}
                      onPress={() =>
                        data(
                          f.key,
                          Array.isArray(value) && value.includes(p.value)
                            ? value.filter((v) => v !== p.value)
                            : [...(Array.isArray(value) ? value : []), p.value],
                        )
                      }
                    >
                      {p.label}
                    </Action>
                  ))}
                </Panel>
              );
            if (f.key === 'employeeId' || f.key === 'productId')
              return (
                <Select
                  key={f.key}
                  label={label}
                  value={String(value || '')}
                  options={f.key === 'employeeId' ? personOptions : options('product')}
                  onChange={(v) => data(f.key, v)}
                />
              );
            if (f.options)
              return (
                <Select
                  key={f.key}
                  label={label}
                  value={String(value || '')}
                  options={f.options.map((v) => ({
                    value: v,
                    label: displayLabel(v, en ? 'en' : 'hu'),
                  }))}
                  onChange={(v) => data(f.key, v)}
                />
              );
            return (
              <Field
                key={f.key}
                label={label}
                value={Array.isArray(value) ? value.join('\n') : String(value ?? '')}
                keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                multiline={f.type === 'array'}
                onChangeText={(v) =>
                  data(
                    f.key,
                    f.type === 'number'
                      ? Number.isFinite(Number(v))
                        ? Number(v)
                        : 0
                      : f.type === 'array'
                        ? v.split('\n')
                        : v,
                  )
                }
              />
            );
          })}
          <ReferencePicker
            ids={Array.isArray(input.data.relatedIds) ? input.data.relatedIds : []}
            onChange={(ids) => data('relatedIds', ids)}
            snapshot={snapshot}
            en={en}
            exclude={item?._id}
          />
          <Panel>
            <Label strong size={18}>
              {t('Ellenőrzőlista', 'Checklist')}
            </Label>
            {input.checks.map((c, i) => (
              <View
                key={c.id}
                style={{
                  gap: 12,
                  borderBottomWidth: 1,
                  borderColor: colors.line,
                  paddingBottom: 16,
                }}
              >
                <Field
                  label={`${i + 1}. ${t('Ellenőrzési pont', 'Check')}`}
                  value={c.label}
                  onChangeText={(label) => checkUpdate(i, { label })}
                />
                <Select
                  label={t('Válasz típusa', 'Response type')}
                  value={c.type}
                  options={[
                    { value: 'check', label: t('Pipa', 'Checkbox') },
                    { value: 'text', label: t('Szöveg', 'Text') },
                    { value: 'number', label: t('Mérőállás / szám', 'Reading / number') },
                    { value: 'photo', label: t('Igazoló fotó', 'Photo evidence') },
                  ]}
                  onChange={(type) => checkUpdate(i, { type: (type || 'check') as Check['type'] })}
                />
                <Select
                  label={t('QR-ellenőrzőpont', 'QR checkpoint')}
                  value={c.locationId || ''}
                  options={options('location')}
                  onChange={(locationId) => checkUpdate(i, { locationId })}
                />
                <Row>
                  <Select
                    label={t('Kapcsolódó útmutató', 'Related guide')}
                    value={c.guideId || ''}
                    options={snapshot.records
                      .filter((r) => r.kind === 'article' && r.status === 'published')
                      .map((r) => ({ value: r._id, label: r.title }))}
                    onChange={(guideId) => checkUpdate(i, { guideId })}
                  />
                  <Action
                    secondary={!c.required}
                    onPress={() => checkUpdate(i, { required: !c.required })}
                  >
                    {c.required ? t('Kötelező ✓', 'Required ✓') : t('Opcionális', 'Optional')}
                  </Action>
                  <Action
                    danger
                    onPress={() =>
                      update(
                        'checks',
                        input.checks.filter((_, n) => n !== i),
                      )
                    }
                  >
                    {t('Eltávolítás', 'Remove')}
                  </Action>
                </Row>
              </View>
            ))}
            <Action
              secondary
              onPress={() =>
                update('checks', [
                  ...input.checks,
                  {
                    id: `check-${Date.now()}-${input.checks.length}`,
                    label: '',
                    type: 'check',
                    required: true,
                  },
                ])
              }
            >
              {t('+ Ellenőrzési pont', '+ Check')}
            </Action>
          </Panel>
          {kind === 'integration' && (
            <Label muted>
              {t(
                'A szolgáltatói kapcsolat beállítási igénye rögzíthető. Éles adatkapcsolat csak külön telepített adapterrel működik. Titkos kulcsot ne írj ide.',
                'Record the connection requirements. Live connections require a deployed provider adapter. Do not enter secrets here.',
              )}
            </Label>
          )}
          <Action busy={busy} onPress={() => void submit()}>
            {t('Mentés', 'Save')}
          </Action>
        </ScrollView>
      </View>
    </Modal>
  );
}
