import { useState } from 'react';
import { Action, Badge, Label, Row, Select } from '../design-system/components';
import { displayLabel } from './modules';

const kinds = [
  'hotel',
  'location',
  'task',
  'cleaning',
  'template',
  'round',
  'product',
  'consumption',
  'vendor',
  'handover',
  'request',
  'article',
  'complaint',
  'event',
  'onboarding',
  'purchase',
  'incident',
  'audit',
  'asset',
  'announcement',
  'conversation',
  'poll',
  'idea',
  'found',
  'stock',
  'integration',
];
export function PermissionEditor({
  value,
  onChange,
  en,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  en: boolean;
}) {
  const [kind, setKind] = useState('task');
  const toggle = (permission: string) =>
    onChange(
      value.includes(permission) ? value.filter((v) => v !== permission) : [...value, permission],
    );
  const presets = [
    [
      'housekeeping',
      [
        'hotel:read',
        'location:read',
        'task:read',
        'task:create',
        'cleaning:read',
        'cleaning:create',
        'template:read',
        'round:read',
        'round:create',
        'consumption:read',
        'consumption:create',
        'product:read',
        'article:read',
      ],
    ],
    [
      'maintenance',
      [
        'hotel:read',
        'location:read',
        'task:read',
        'task:create',
        'round:read',
        'round:create',
        'asset:read',
        'asset:create',
        'article:read',
      ],
    ],
    [
      'reception',
      [
        'hotel:read',
        'location:read',
        'task:read',
        'task:create',
        'request:read',
        'request:create',
        'request:manage',
        'handover:read',
        'handover:create',
        'consumption:read',
        'consumption:manage',
        'article:read',
      ],
    ],
  ] as const;
  return (
    <>
      <Row>
        {presets.map(([name, permissions]) => (
          <Action
            key={name}
            secondary
            onPress={() => onChange([...new Set([...value, ...permissions])])}
          >{`+ ${displayLabel(name, en ? 'en' : 'hu')}`}</Action>
        ))}
      </Row>
      <Select
        label={en ? 'Permission area' : 'Jogosultsági terület'}
        value={kind}
        options={kinds.map((value) => ({ value, label: displayLabel(value, en ? 'en' : 'hu') }))}
        onChange={(v) => setKind(v || 'task')}
      />
      <Row>
        {['read', 'create', 'manage', 'approve'].map((action, i) => (
          <Action
            key={action}
            secondary={!value.includes(`${kind}:${action}`)}
            onPress={() => toggle(`${kind}:${action}`)}
          >
            {
              (en
                ? ['View', 'Create', 'Manage', 'Approve']
                : ['Megtekintés', 'Létrehozás', 'Kezelés', 'Jóváhagyás'])[i]
            }
          </Action>
        ))}
      </Row>
      <Row>
        <Badge>{en ? `${value.length} permissions` : `${value.length} engedély`}</Badge>
        <Action secondary compact onPress={() => onChange([])}>
          {en ? 'Clear direct permissions' : 'Közvetlen engedélyek törlése'}
        </Action>
      </Row>
      <Label muted size={11}>
        {en
          ? 'Permissions add together. Without an explicit grant, access is denied.'
          : 'Az engedélyek összeadódnak. Kifejezett engedély nélkül a hozzáférés tiltott.'}
      </Label>
    </>
  );
}
