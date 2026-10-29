import { useState } from 'react';
import { Image, View } from 'react-native';
import { Action, Label } from '../design-system/components';
import { displayLabel } from './modules';
import type { Activity } from './types';
import type { WorkspaceState } from './use-workspace';

export function ActivityEntry({
  activity: a,
  state,
  en,
}: {
  activity: Activity;
  state: WorkspaceState;
  en: boolean;
}) {
  const [uri, setUri] = useState('');
  const [translation, setTranslation] = useState('');
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ gap: 8, paddingVertical: 12 }}>
      <Label strong>{a.actorName}</Label>
      <Label muted size={11}>
        {new Date(a.createdAt).toLocaleString(en ? 'en-GB' : 'hu-HU')} ·{' '}
        {displayLabel(a.type, en ? 'en' : 'hu')}
      </Label>
      {!!a.text && <Label>{a.text}</Label>}
      {a.type === 'comment' && !!a.text && (
        <Action
          secondary
          compact
          disabled={state.busy}
          onPress={() =>
            void state.run(async () => {
              const result = await state.request<{ text: string }>(
                `/records/${a.recordId}/translate`,
                'POST',
                { target: en ? 'en' : 'hu', activityId: a._id },
              );
              setTranslation(result.text);
            })
          }
        >
          {en ? 'Translate comment' : 'Hozzászólás fordítása'}
        </Action>
      )}
      {!!translation && (
        <>
          <Label muted size={10}>
            {en ? 'Machine translation · DeepSeek' : 'Gépi fordítás · DeepSeek'}
          </Label>
          <Label>{translation}</Label>
        </>
      )}
      {!!a.snapshot && (
        <>
          <Action secondary compact onPress={() => setExpanded(!expanded)}>
            {en ? `View version ${a.version}` : `${a.version}. verzió megtekintése`}
          </Action>
          {expanded && (
            <>
              <Label strong>{a.snapshot.title}</Label>
              <Label>{a.snapshot.description}</Label>
              <Label muted>{displayLabel(a.snapshot.status, en ? 'en' : 'hu')}</Label>
              {a.snapshot.data.meterValue !== undefined && (
                <Label>
                  {en ? 'Meter reading' : 'Mérőállás'}: {a.snapshot.data.meterValue}{' '}
                  {a.snapshot.data.meterUnit}
                </Label>
              )}
              {a.snapshot.checks.map((c) => (
                <Label key={c.id}>
                  {c.completedAt ? '✓' : '○'} {c.label} · {String(c.value ?? '')} {c.reason}
                </Label>
              ))}
            </>
          )}
        </>
      )}
      {!!a.attachment && (
        <Action
          secondary
          onPress={() =>
            void state.run(async () => {
              const photo = await state.request<{ mime: string; base64: string }>(
                `/photos/${a.attachment!.id}`,
              );
              setUri(`data:${photo.mime};base64,${photo.base64}`);
            })
          }
        >
          {en ? 'Open attached photo' : 'Csatolt fotó megnyitása'}
        </Action>
      )}
      {!!uri && (
        <Image
          accessibilityLabel={a.attachment?.name}
          source={{ uri }}
          style={{ width: '100%', height: 260, resizeMode: 'contain' }}
        />
      )}
    </View>
  );
}
