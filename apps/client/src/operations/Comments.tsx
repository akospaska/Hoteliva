import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Action, Field, Label, Panel, Row, Select } from '../design-system/components';
import type { Activity, Detail, Item } from './types';
import { ActivityEntry } from './ActivityEntry';
import type { WorkspaceState } from './use-workspace';

export function Comments({ item, state, en }: { item: Item; state: WorkspaceState; en: boolean }) {
  const { request, setError } = state;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [text, setText] = useState('');
  const [mention, setMention] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; mime: string; base64: string }>();
  const [revision, setRevision] = useState(0);
  const [more, setMore] = useState(false);
  const initialHistory = useRef(false);
  useEffect(() => {
    let alive = true;
    const load = () =>
      void request<Detail>(`/records/${item._id}`)
        .then((d) => {
          if (alive) {
            setActivities((current) =>
              [
                ...current.filter((old) => !d.activities.some((next) => next._id === old._id)),
                ...d.activities,
              ].sort(
                (a, b) => a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id),
              ),
            );
            if (!initialHistory.current) {
              setMore(d.activities.length === 100);
              initialHistory.current = true;
            }
          }
        })
        .catch((e: Error) => {
          if (alive) setError(e.message);
        });
    load();
    const timer = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [item._id, item.version, revision, request, setError]);
  const photo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      if (asset.base64.length > 5500000) {
        state.setError('IMAGE_TOO_LARGE');
        return;
      }
      setAttachment({
        base64: asset.base64,
        mime: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'photo.jpg',
      });
    }
  };
  async function send() {
    const result = await state.run(async () => {
      await state.request(`/records/${item._id}/comments`, 'POST', {
        text,
        mentions: mention ? [mention] : [],
        attachment,
      });
      return true;
    });
    if (result) {
      setText('');
      setMention('');
      setAttachment(undefined);
      setRevision((v) => v + 1);
    }
  }
  return (
    <Panel>
      <Label strong size={18}>
        {en ? 'Conversation & activity' : 'Beszélgetés és előzmények'}
      </Label>
      <Field label={en ? 'Comment' : 'Hozzászólás'} value={text} onChangeText={setText} multiline />
      <Select
        label={en ? 'Mention a colleague' : 'Munkatárs megemlítése'}
        value={mention}
        options={state.snapshot!.people.map((p) => ({ value: p._id, label: p.name }))}
        onChange={setMention}
      />
      <Row>
        <Action secondary onPress={() => void state.run(photo)}>
          {en ? 'Attach photo' : 'Fotó csatolása'}
        </Action>
        <Action disabled={state.busy || (!text.trim() && !attachment)} onPress={() => void send()}>
          {en ? 'Send' : 'Küldés'}
        </Action>
        {!!attachment && (
          <Action secondary onPress={() => setAttachment(undefined)}>
            {en ? 'Remove photo' : 'Fotó eltávolítása'}
          </Action>
        )}
      </Row>
      {!!attachment && (
        <Image
          source={{ uri: `data:${attachment.mime};base64,${attachment.base64}` }}
          style={{ width: 160, height: 120 }}
        />
      )}
      {activities
        .slice()
        .reverse()
        .map((a) => (
          <ActivityEntry key={a._id} activity={a} state={state} en={en} />
        ))}
      {more && (
        <Action
          secondary
          disabled={state.busy}
          onPress={() =>
            void state.run(async () => {
              const oldest = activities[0];
              if (!oldest) return;
              const older = await state.request<Activity[]>(
                `/records/${item._id}/history`,
                'POST',
                { before: { createdAt: oldest.createdAt, id: oldest._id } },
              );
              setActivities((current) => [...older, ...current]);
              setMore(older.length === 100);
            })
          }
        >
          {en ? 'Load older activity' : 'Régebbi előzmények betöltése'}
        </Action>
      )}
    </Panel>
  );
}
