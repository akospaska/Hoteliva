import { Action, Label, Panel, Row } from '../design-system/components';
import type { ItemInput } from './types';
import type { WorkspaceState } from './use-workspace';

export function QuickTemplates({
  state,
  en,
  hotelId,
  locationId = '',
  onCreate,
}: {
  state: WorkspaceState;
  en: boolean;
  hotelId: string;
  locationId?: string;
  onCreate: (kind: string, input?: Partial<ItemInput>) => void;
}) {
  const templates = state.snapshot!.records.filter(
    (r) =>
      r.kind === 'template' &&
      r.status === 'active' &&
      (!hotelId || r.hotelId === hotelId) &&
      r.data.purpose === 'quick',
  );
  if (!templates.length) return null;
  return (
    <Panel>
      <Label strong>{en ? 'Frequent requests' : 'Gyakori bejelentések'}</Label>
      <Row>
        {templates.map((template) => (
          <Action
            key={template._id}
            secondary
            onPress={() =>
              onCreate(String(template.data.targetKind || 'task'), {
                title: template.title,
                description: template.description,
                department: template.department,
                priority: template.priority,
                hotelId: template.hotelId,
                locationId: locationId || template.locationId,
                parentId: template._id,
                checks: template.checks.map(
                  ({ id, label, type, required, locationId, guideId }) => ({
                    id,
                    label,
                    type,
                    required,
                    locationId,
                    guideId,
                  }),
                ),
              })
            }
          >
            {template.title}
          </Action>
        ))}
      </Row>
    </Panel>
  );
}
