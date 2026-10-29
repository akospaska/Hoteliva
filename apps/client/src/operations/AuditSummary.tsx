import { Label, Panel, Row } from '../design-system/components';
import type { Item } from './types';

export function AuditSummary({ records, en }: { records: Item[]; en: boolean }) {
  const audits = records.filter((r) => r.kind === 'audit' && r.status !== 'cancelled');
  const ids = new Set(audits.map((r) => r._id));
  const checks = audits.flatMap((r) => r.checks);
  const passed = checks.filter((c) => c.completedAt && !c.reason).length;
  const exceptions = checks.filter((c) => c.reason).length;
  const corrective = records.filter(
    (r) => ids.has(r.parentId) && !['done', 'cancelled'].includes(r.status),
  );
  const metrics = [
    [
      en ? 'Checks completed without exception' : 'Kivétel nélkül teljesített pontok',
      `${passed}/${checks.length}`,
    ],
    [en ? 'Documented exceptions' : 'Dokumentált eltérések', exceptions],
    [en ? 'Open corrective actions' : 'Nyitott javító feladatok', corrective.length],
  ];
  return (
    <Panel>
      <Label strong>{en ? 'Quality overview' : 'Minőségi áttekintés'}</Label>
      <Row style={{ alignItems: 'stretch' }}>
        {metrics.map(([title, value]) => (
          <Panel key={title} style={{ flex: 1, minWidth: 180 }}>
            <Label muted size={12}>
              {title}
            </Label>
            <Label strong size={30}>
              {value}
            </Label>
          </Panel>
        ))}
      </Row>
      <Label muted size={11}>
        {en
          ? 'Counts use visible audits. An exception is not a passed check; approval remains a separate supervisor decision.'
          : 'A látható auditokból számolva. Az eltérés nem teljesített pont; a jóváhagyás külön vezetői döntés.'}
      </Label>
    </Panel>
  );
}
