import { useState } from 'react';
import { Action, Field, Label, Panel, Select } from '../design-system/components';
import { PermissionEditor } from './PermissionEditor';
import type { WorkspaceState } from './use-workspace';

export function Roles({ state, en }: { state: WorkspaceState; en: boolean }) {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const roles = state.snapshot!.records.filter((r) => r.kind === 'role');
  return (
    <Panel>
      <Label strong size={20}>
        {en ? 'Custom role templates' : 'Saját szerepkörsablonok'}
      </Label>
      <Select
        label={en ? 'Role template' : 'Szerepkörsablon'}
        value={id}
        options={roles.map((r) => ({ value: r._id, label: r.title }))}
        empty={en ? 'Create new' : 'Új létrehozása'}
        onChange={(id) => {
          const role = roles.find((r) => r._id === id);
          setId(id);
          setTitle(role?.title || '');
          setPermissions(Array.isArray(role?.data.permissions) ? role.data.permissions : []);
          setNotice('');
        }}
      />
      <Field label={en ? 'Role name' : 'Szerepkör neve'} value={title} onChangeText={setTitle} />
      <PermissionEditor value={permissions} onChange={setPermissions} en={en} />
      <Action
        busy={state.busy}
        disabled={!title.trim()}
        onPress={async () => {
          const saved = await state.save(
            {
              kind: 'role',
              title,
              description: '',
              hotelId: '',
              locationId: '',
              department: '',
              assigneeId: '',
              dueAt: '',
              priority: 'normal',
              parentId: '',
              checks: [],
              data: { permissions },
            },
            roles.find((r) => r._id === id),
          );
          if (saved) {
            setId(saved._id);
            setNotice(
              en
                ? 'Role saved. Assigned members receive the updated permissions on their next request.'
                : 'Szerepkör mentve. A hozzárendelt munkatársaknál a következő kéréskor az új engedélyek érvényesek.',
            );
          }
        }}
      >
        {en ? 'Save role' : 'Szerepkör mentése'}
      </Action>
      {!!notice && <Label>{notice}</Label>}
    </Panel>
  );
}
