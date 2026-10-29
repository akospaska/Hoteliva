import { Action, Row, Select } from '../design-system/components';
import type { Snapshot } from './types';

export function ReferencePicker({
  ids,
  onChange,
  snapshot,
  en,
  exclude,
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
  snapshot: Snapshot;
  en: boolean;
  exclude?: string;
}) {
  return (
    <>
      <Select
        label={en ? 'Link existing work or guidance' : 'Meglévő ügy vagy útmutató kapcsolása'}
        value=""
        options={snapshot.records
          .filter(
            (r) =>
              r._id !== exclude &&
              !['role', 'hotel', 'location', 'policy'].includes(r.kind) &&
              !ids.includes(r._id),
          )
          .map((r) => ({ value: r._id, label: r.title }))}
        onChange={(id) => {
          if (id) onChange([...ids, id]);
        }}
      />
      <Row>
        {ids.map((id) => (
          <Action
            key={id}
            secondary
            compact
            onPress={() => onChange(ids.filter((v) => v !== id))}
          >{`${snapshot.records.find((r) => r._id === id)?.title || (en ? 'Unavailable' : 'Nem elérhető')} ×`}</Action>
        ))}
      </Row>
    </>
  );
}
