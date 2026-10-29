import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Modal, ScrollView, View, useWindowDimensions } from 'react-native';
import { Action, Badge, Label, Panel, Row, Select } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { layout } from '../design-system/tokens';
import { modules } from '../operations/modules';
import { Navigation } from '../operations/Navigation';
import { ModuleContent } from '../operations/ModuleContent';
import { RecordDetail } from '../operations/RecordDetail';
import { Editor } from '../operations/Editor';
import { PlatformAdmin } from '../operations/PlatformAdmin';
import { Scanner } from '../operations/Scanner';
import { message, useWorkspace } from '../operations/use-workspace';
import type { Item, ItemInput } from '../operations/types';
import type { SessionState } from '../lib/use-session';

export function Workspace({ session }: { session: SessionState }) {
  const params = useLocalSearchParams<{
    module?: string;
    record?: string;
    group?: string;
    hotel?: string;
    qr?: string;
  }>();
  const state = useWorkspace(session.user?.role === 'platform_admin' ? params.group || '' : '');
  const { colors, mode, toggle } = useDesign();
  const { width } = useWindowDimensions();
  const desktop = width >= layout.desktop;
  const en = session.locale === 'en';
  const t = (hu: string, english: string) => (en ? english : hu);
  const module = modules.find((m) => m.id === params.module) || modules[0];
  const [menu, setMenu] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [notices, setNotices] = useState(false);
  const [editor, setEditor] = useState<{
    kind: string;
    item?: Item;
    initial?: Partial<ItemInput>;
  }>();
  const snapshot = state.snapshot;
  const refreshSession = session.refresh;
  useEffect(() => {
    if (['UNAUTHORIZED', 'SUSPENDED'].includes(state.error)) void refreshSession();
  }, [state.error, refreshSession]);
  const { request, setError } = state;
  const groupId = snapshot?.context?.groupId;
  const selected = snapshot?.records.find((r) => r._id === params.record);
  const selectModule = (id: string) => {
    router.setParams({ module: id, record: '', qr: '' });
    setMenu(false);
  };
  const open = (id: string) => router.setParams({ record: id, qr: '' });
  const create = (kind: string, initial?: Partial<ItemInput>) => setEditor({ kind, initial });
  useEffect(() => {
    if (!params.qr || !groupId) return;
    let alive = true;
    void request<Item>(`/qr/${encodeURIComponent(params.qr)}`)
      .then((r) => {
        if (alive) router.setParams({ record: r._id, module: 'F02', qr: '' });
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      alive = false;
    };
  }, [params.qr, groupId, request, setError]);
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {!!desktop && <Navigation selected={module.id} en={en} onSelect={selectModule} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            paddingHorizontal: desktop ? 32 : 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <Row>
              {!desktop && (
                <Action secondary compact onPress={() => setMenu(true)}>
                  ☰
                </Action>
              )}
              <Label strong>
                {desktop
                  ? t('Praktikus segítség minden műszakban', 'Practical support for every shift')
                  : 'hoteliva'}
              </Label>
            </Row>
            <Row>
              <Action secondary compact onPress={toggle}>
                {mode === 'light' ? '◐' : '☀'}
              </Action>
              <Action secondary compact onPress={() => void session.changeLocale(en ? 'hu' : 'en')}>
                {en ? 'HU' : 'EN'}
              </Action>
              <Action
                secondary
                compact
                onPress={() => setNotices(!notices)}
              >{`◷ ${snapshot?.notifications.filter((n) => !n.readAt).length || 0}`}</Action>
              <Action secondary compact onPress={() => void session.logout()}>
                {t('Kilépés', 'Sign out')}
              </Action>
            </Row>
          </Row>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: desktop ? 32 : 16,
            gap: desktop ? 24 : 16,
            maxWidth: layout.maxContent,
            width: '100%',
            alignSelf: 'center',
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 6, flex: 1, minWidth: 180 }}>
              {desktop && (
                <Label muted size={11}>
                  {t('HOTELMŰKÖDÉS · EGYÜTT', 'HOTEL OPERATIONS · TOGETHER')}
                </Label>
              )}
              <Label accessibilityRole="header" strong size={desktop ? 30 : 25}>
                {selected?.title || (en ? module.en : module.hu)}
              </Label>
              {(desktop || module.id === 'F12') && (
                <Label muted size={12}>
                  {new Date().toLocaleDateString(en ? 'en-GB' : 'hu-HU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Label>
              )}
            </View>
            {desktop && session.user?.role === 'platform_admin' && snapshot?.context && (
              <Action secondary onPress={() => setScopeOpen(!scopeOpen)}>
                {t('Hotelcsoport váltása', 'Switch hotel group')}
              </Action>
            )}
            <Action secondary onPress={() => setScanner(true)}>
              {t('QR beolvasás', 'Scan QR')}
            </Action>
          </Row>
          {!!state.error && (
            <Panel>
              <Label accessibilityRole="alert" style={{ color: colors.danger }}>
                {message(state.error, en)}
              </Label>
              <Action secondary onPress={() => void state.refresh()}>
                {t('Frissítés', 'Refresh')}
              </Action>
            </Panel>
          )}
          {!snapshot && <ActivityIndicator color={colors.primary} />}
          {!!snapshot && (
            <>
              <Row>
                {session.user?.role === 'platform_admin' && (!snapshot.context || scopeOpen) && (
                  <View style={{ minWidth: 200, flex: 1, maxWidth: desktop ? 360 : undefined }}>
                    <Select
                      label={t('Hotelcsoport', 'Hotel group')}
                      value={params.group || ''}
                      options={snapshot.groups.map((g) => ({ value: g._id, label: g.name }))}
                      onChange={(group) => router.setParams({ group, hotel: '', record: '' })}
                    />
                  </View>
                )}
                {!!snapshot.context && (
                  <View style={{ minWidth: 200, flex: 1, maxWidth: desktop ? 360 : undefined }}>
                    <Select
                      label={t('Hotel', 'Hotel')}
                      value={params.hotel || ''}
                      options={snapshot.records
                        .filter((r) => r.kind === 'hotel')
                        .map((r) => ({ value: r._id, label: r.title }))}
                      empty={t('Minden hozzáférhető hotel', 'All accessible hotels')}
                      onChange={(hotel) => router.setParams({ hotel, record: '' })}
                    />
                  </View>
                )}
              </Row>
              {!snapshot.context && (
                <Panel>
                  <Label strong>
                    {t(`Üdv, ${session.user?.name}.`, `Welcome, ${session.user?.name}.`)}
                  </Label>
                  <Label muted>
                    {t(
                      'Válassz hotelcsoportot a munkavégzéshez.',
                      'Select a hotel group to start working.',
                    )}
                  </Label>
                </Panel>
              )}
              {session.user?.role === 'platform_admin' &&
                (!snapshot.context || module.id === 'F01') && (
                  <PlatformAdmin
                    state={state}
                    en={en}
                    groupId={params.group || ''}
                    hotelId={params.hotel || ''}
                  />
                )}
              {!!notices && (
                <Panel>
                  <Label strong>{t('Értesítések', 'Notifications')}</Label>
                  {snapshot.notifications.length === 0 && (
                    <Label muted>{t('Nincs új értesítés.', 'No new notifications.')}</Label>
                  )}
                  {snapshot.notifications.map((n) => (
                    <Row key={n._id}>
                      <Badge>{n.readAt ? '✓' : '●'}</Badge>
                      <Action
                        secondary
                        onPress={() => {
                          open(n.recordId);
                          void state.run(() =>
                            state.request(`/notifications/${n._id}/read`, 'POST'),
                          );
                        }}
                      >
                        {n.text}
                      </Action>
                    </Row>
                  ))}
                </Panel>
              )}
              {!!snapshot.context &&
                (selected ? (
                  <>
                    <Action secondary onPress={() => router.setParams({ record: '' })}>
                      {t('← Vissza a listához', '← Back to list')}
                    </Action>
                    <RecordDetail
                      key={selected._id}
                      item={selected}
                      state={state}
                      en={en}
                      onEdit={() => setEditor({ kind: selected.kind, item: selected })}
                      onCreate={create}
                      onOpen={open}
                    />
                  </>
                ) : (
                  <ModuleContent
                    key={module.id}
                    module={module}
                    state={state}
                    en={en}
                    hotelId={params.hotel || ''}
                    onCreate={create}
                    onOpen={open}
                  />
                ))}
            </>
          )}
        </ScrollView>
        {!desktop && (
          <Row
            style={{
              padding: 10,
              backgroundColor: colors.surface,
              justifyContent: 'space-around',
              borderTopWidth: 1,
              borderColor: colors.line,
            }}
          >
            {['F12', 'F03', 'F04'].map((id) => (
              <Action
                key={id}
                secondary={module.id !== id}
                compact
                onPress={() => selectModule(id)}
              >
                {en ? modules.find((m) => m.id === id)!.en : modules.find((m) => m.id === id)!.hu}
              </Action>
            ))}
          </Row>
        )}
      </View>
      {!!menu && (
        <Modal visible animationType="slide" onRequestClose={() => setMenu(false)}>
          <Action secondary onPress={() => setMenu(false)}>
            {t('Bezárás', 'Close')}
          </Action>
          {session.user?.role === 'platform_admin' && snapshot?.context && (
            <Action
              secondary
              onPress={() => {
                setScopeOpen(!scopeOpen);
                setMenu(false);
              }}
            >
              {t('Hotelcsoport váltása', 'Switch hotel group')}
            </Action>
          )}
          <Navigation selected={module.id} en={en} mobile onSelect={selectModule} />
        </Modal>
      )}
      {!!scanner && (
        <Scanner
          en={en}
          onClose={() => setScanner(false)}
          onScan={(qr) => {
            setScanner(false);
            router.setParams({ qr });
          }}
        />
      )}
      {!!editor && snapshot && (
        <Editor
          {...editor}
          snapshot={snapshot}
          en={en}
          busy={state.busy}
          issue={state.error}
          onClose={() => setEditor(undefined)}
          onSave={async (input) => {
            const saved = await state.save(input, editor.item);
            if (saved) {
              setEditor(undefined);
              open(saved._id);
            }
          }}
        />
      )}
    </View>
  );
}
