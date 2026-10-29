import { useState } from 'react';
import { Action, Label, Panel } from '../design-system/components';
import * as ImagePicker from 'expo-image-picker';
import type { Check, Item, Activity } from './types';
import type { WorkspaceState } from './use-workspace';

export function CheckEvidence({
  check,
  item,
  state,
  en,
}: {
  check: Check;
  item: Item;
  state: WorkspaceState;
  en: boolean;
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const ctx = state.snapshot!.context!;
  const editable =
    !['done', 'cancelled'].includes(item.status) &&
    (ctx.manager ||
      ctx.permissions.includes(`${item.kind}:manage`) ||
      item.assigneeId === ctx.userId);
  const guide = state.snapshot!.records.find(
    (r) => r._id === check.guideId && r.status === 'published',
  );
  async function photo() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    const file = picked.assets?.[0];
    if (!file?.base64 || picked.canceled) return;
    const activity = await state.request<Activity>(`/records/${item._id}/comments`, 'POST', {
      text: check.label,
      attachment: {
        base64: file.base64,
        mime: file.mimeType || 'image/jpeg',
        name: file.fileName || 'check.jpg',
      },
    });
    await state.request(`/records/${item._id}/actions`, 'POST', {
      version: item.version,
      action: 'check',
      checkId: check.id,
      value: activity._id,
    });
  }
  return (
    <>
      {!!guide && (
        <Action secondary onPress={() => setGuideOpen(!guideOpen)}>
          {en ? 'How to do this' : 'Így csináld'}
        </Action>
      )}
      {guideOpen && guide && (
        <Panel>
          <Label strong>{guide.title}</Label>
          <Label>{guide.description}</Label>
        </Panel>
      )}
      {check.type === 'photo' && (
        <Action
          disabled={state.busy || !editable || (!!check.locationId && !check.scannedAt)}
          onPress={() => void state.run(photo)}
        >
          {en ? 'Attach photo evidence' : 'Igazoló fotó csatolása'}
        </Action>
      )}
    </>
  );
}
