import { useClock } from './use-clock';
import { useState } from 'react';
import { View } from 'react-native';
import { Action, Badge, Field, Label, Panel, Row } from '../design-system/components';
import { useDesign } from '../design-system/theme';
import { RecordList } from './RecordList';
import { HotelPulse } from './HotelPulse';
import type { Snapshot } from './types';
import type { WorkspaceState } from './use-workspace';

export function Insights({
  snapshot,
  en,
  analytics = false,
  onOpen,
}: {
  snapshot: Snapshot;
  en: boolean;
  analytics?: boolean;
  onOpen: (id: string) => void;
}) {
  const now = useClock();
  const [metric, setMetric] = useState<number | null>(null);
  const { colors } = useDesign();
  const t = (hu: string, english: string) => (en ? english : hu);
  const rooms = snapshot.records.filter((r) => r.kind === 'location' && r.data.type === 'room');
  const work = snapshot.records.filter((r) =>
    ['task', 'cleaning', 'request', 'round', 'audit'].includes(r.kind),
  );
  const open = work.filter((r) => !['done', 'cancelled'].includes(r.status));
  const overdue = open.filter((r) => r.dueAt && Date.parse(r.dueAt) < now);
  const metrics = [
    [
      t('Használatra kész', 'Ready rooms'),
      rooms.filter(
        (r) =>
          r.status === 'active' &&
          r.data.occupancy === 'vacant' &&
          r.data.cleanliness === 'clean' &&
          r.data.maintenance === 'available',
      ).length,
      `${rooms.length} ${t('szobából', 'rooms total')}`,
    ],
    [
      t('Folyamatban lévő munkák', 'Open work'),
      open.length,
      t('Minden részleg', 'All departments'),
    ],
    [t('Figyelmet kér', 'Needs attention'), overdue.length, t('Lejárt határidő', 'Overdue')],
    [
      t('Ellenőrzésre vár', 'Awaiting review'),
      work.filter((r) => r.status === 'review').length,
      t('Vezetői ellenőrzés', 'Supervisor review'),
    ],
  ];
  return (
    <View style={{ gap: 24 }}>
      <Row style={{ alignItems: 'stretch' }}>
        {metrics.map(([title, value, subtitle], index) => (
          <Panel key={title} style={{ flexGrow: 1, flexBasis: 180 }}>
            <Label muted size={12}>
              {title}
            </Label>
            <Label strong size={38}>
              {value}
            </Label>
            <Label muted size={11}>
              {subtitle}
            </Label>
            <Action secondary compact onPress={() => setMetric(metric === index ? null : index)}>
              {t('Részletek', 'Details')}
            </Action>
          </Panel>
        ))}
      </Row>
      {metric !== null && (
        <Panel>
          <Label strong>{metrics[metric][0]}</Label>
          <RecordList
            items={
              metric === 0
                ? rooms.filter(
                    (r) =>
                      r.status === 'active' &&
                      r.data.occupancy === 'vacant' &&
                      r.data.cleanliness === 'clean' &&
                      r.data.maintenance === 'available',
                  )
                : metric === 1
                  ? open
                  : metric === 2
                    ? overdue
                    : work.filter((r) => r.status === 'review')
            }
            {...{ snapshot, en, onOpen }}
          />
        </Panel>
      )}
      {!analytics && <HotelPulse records={snapshot.records} en={en} onOpen={onOpen} />}
      {!!analytics && (
        <Panel>
          <Label strong size={20}>
            {t('Munkatársak terhelése', 'Team workload')}
          </Label>
          {snapshot.people.map((person) => {
            const tasks = open.filter((r) => r.assigneeId === person._id);
            const minutes = tasks.reduce(
              (total, r) => total + Number(r.data.estimatedMinutes || 0),
              0,
            );
            return (
              <View key={person._id} style={{ gap: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Label>{person.name}</Label>
                  <Label muted>
                    {tasks.length} · {minutes} {t('tervezett perc', 'planned minutes')}
                  </Label>
                </Row>
                <View style={{ height: 8, backgroundColor: colors.soft, borderRadius: 4 }}>
                  <View
                    style={{
                      height: 8,
                      width: `${Math.min(100, tasks.length * 10)}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            );
          })}
          <Label muted>
            {t(
              'Az adatok a jelenlegi jogosultságod és hotelszűrőd szerint látható munkákból számolódnak.',
              'Metrics are calculated from work visible to your permissions and hotel filter.',
            )}
          </Label>
        </Panel>
      )}
      <Panel>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label strong size={20}>
            {t('Mai fókusz', 'Today’s focus')}
          </Label>
          <Badge>{String(overdue.length)}</Badge>
        </Row>
        <Label muted>
          {t('A sürgős és lejárt munkák kerülnek előre.', 'Urgent and overdue work comes first.')}
        </Label>
      </Panel>
      <RecordList
        items={open
          .slice()
          .sort(
            (a, b) =>
              (a.priority === 'urgent' ? -1 : 0) - (b.priority === 'urgent' ? -1 : 0) ||
              (a.dueAt || 'z').localeCompare(b.dueAt || 'z'),
          )
          .slice(0, 12)}
        {...{ snapshot, en, onOpen }}
      />
    </View>
  );
}
export function Assistant({
  state,
  en,
  onOpen,
}: {
  state: WorkspaceState;
  en: boolean;
  onOpen: (id: string) => void;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{
    answer: string;
    insufficient?: boolean;
    sources: { id: string; title: string }[];
  }>();
  return (
    <Panel>
      <Badge>DeepSeek</Badge>
      <Label strong size={24}>
        {en ? 'What do you need help with?' : 'Miben segíthetünk a munkádhoz?'}
      </Label>
      <Label muted>
        {en
          ? 'Answers use published handbook articles you can access. Check the sources before acting.'
          : 'A válasz a számodra hozzáférhető, közzétett útmutatókból készül. Munkavégzés előtt ellenőrizd a forrásokat.'}
      </Label>
      <Field
        label={en ? 'Your question' : 'Kérdésed'}
        value={question}
        onChangeText={setQuestion}
        multiline
      />
      <Action
        disabled={state.busy || question.trim().length < 3}
        onPress={() =>
          void state.run(async () => setAnswer(await state.request('/ask', 'POST', { question })))
        }
      >
        {en ? 'Ask the handbook' : 'Kérdezd a tudástárat'}
      </Action>
      {!!answer && (
        <>
          <Label>
            {answer.insufficient
              ? en
                ? 'No suitable approved source was found. Search the handbook or ask a supervisor.'
                : 'Nem található megfelelő jóváhagyott forrás. Keress a tudástárban, vagy kérdezd a vezetőt.'
              : answer.answer}
          </Label>
          {answer.sources.map((source) => (
            <Action key={source.id} secondary onPress={() => onOpen(source.id)}>
              {source.title}
            </Action>
          ))}
        </>
      )}
    </Panel>
  );
}
