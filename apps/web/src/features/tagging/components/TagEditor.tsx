import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useEffect, useMemo, useState } from 'react';
import type { ZodIssue } from 'zod';

import { tagEditorFormSchema, type TagEditorFormData, type TagEditorRow } from '../schema';

function createRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tag-${Math.random().toString(36).slice(2, 10)}`;
}

function buildRowsFromTags(tags: Record<string, string>): TagEditorRow[] {
  return Object.entries(tags)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([key, value]) => ({ id: createRowId(), key, value }));
}

function rowsToRecord(rows: TagEditorRow[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((accumulator, row) => {
    accumulator[row.key] = row.value;
    return accumulator;
  }, {});
}

type FieldErrors = Record<string, { key?: string; value?: string }>;

function deriveFieldErrors(rows: TagEditorRow[], issues: ZodIssue[]): FieldErrors {
  const fieldErrors: FieldErrors = {};

  issues.forEach((issue) => {
    const path = issue.path;
    const fieldName = path[path.length - 1];
    const indexCandidate = path.length >= 2 ? path[path.length - 2] : undefined;
    if ((fieldName === 'key' || fieldName === 'value') && typeof indexCandidate === 'number') {
      const row = rows[indexCandidate];
      if (!row) {
        return;
      }
      if (!fieldErrors[row.id]) {
        fieldErrors[row.id] = {};
      }
      fieldErrors[row.id]![fieldName] = issue.message;
    }
  });

  return fieldErrors;
}

function useTagRows(initialTags: Record<string, string>) {
  const [rows, setRows] = useState<TagEditorRow[]>(() => buildRowsFromTags(initialTags));

  useEffect(() => {
    setRows(buildRowsFromTags(initialTags));
  }, [initialTags]);

  return [rows, setRows] as const;
}

interface TagEditorProps {
  initialTags: Record<string, string>;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (nextTags: Record<string, string>) => void;
  onCancel: () => void;
}

export function TagEditor({ initialTags, isSubmitting, errorMessage, onSubmit, onCancel }: TagEditorProps) {
  const [rows, setRows] = useTagRows(initialTags);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    setFieldErrors({});
    setFormError(undefined);
  }, [initialTags]);

  const hasRows = rows.length > 0;

  const handleAddRow = () => {
    setRows((previous) => [...previous, { id: createRowId(), key: '', value: '' }]);
  };

  const handleRemoveRow = (rowId: string) => {
    setRows((previous) => previous.filter((row) => row.id !== rowId));
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[rowId];
      return next;
    });
  };

  const handleRowChange = (rowId: string, field: 'key' | 'value', value: string) => {
    setRows((previous) =>
      previous.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
    setFieldErrors((previous) => {
      const existing = previous[rowId];
      if (!existing || !existing[field]) {
        return previous;
      }
      return {
        ...previous,
        [rowId]: { ...existing, [field]: undefined },
      };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(undefined);

    const result = tagEditorFormSchema.safeParse({ rows });
    if (!result.success) {
      setFieldErrors(deriveFieldErrors(rows, result.error.issues));
      setFormError('Please fix the highlighted fields before saving.');
      return;
    }

    const sanitized: TagEditorFormData = result.data;
    setRows(sanitized.rows);
    const nextTags = rowsToRecord(sanitized.rows);
    onSubmit(nextTags);
  };

  const combinedError = useMemo(() => {
    if (formError && errorMessage) {
      return `${formError} ${errorMessage}`;
    }
    return formError ?? errorMessage;
  }, [formError, errorMessage]);

  return (
    <form className="tag-editor" onSubmit={handleSubmit} noValidate>
      <div className="tag-editor__rows" role="group" aria-label="Feature tags">
        {hasRows ? (
          rows.map((row, index) => {
            const errors = fieldErrors[row.id];
            const keyInputId = `tag-key-${row.id}`;
            const valueInputId = `tag-value-${row.id}`;
            const keyErrorId = errors?.key ? `${keyInputId}-error` : undefined;
            const valueErrorId = errors?.value ? `${valueInputId}-error` : undefined;

            return (
              <div key={row.id} className="tag-editor__row">
                <div className="tag-editor__field">
                  <label htmlFor={keyInputId} className="tag-editor__label">
                    Key <span className="tag-editor__field-index">{index + 1}</span>
                  </label>
                  <InputText
                    id={keyInputId}
                    value={row.key}
                    aria-invalid={Boolean(errors?.key)}
                    aria-describedby={keyErrorId}
                    onChange={(event) => handleRowChange(row.id, 'key', event.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors?.key ? (
                    <small id={keyErrorId} className="tag-editor__field-error">
                      {errors.key}
                    </small>
                  ) : null}
                </div>
                <div className="tag-editor__field">
                  <label htmlFor={valueInputId} className="tag-editor__label">
                    Value
                  </label>
                  <InputText
                    id={valueInputId}
                    value={row.value}
                    aria-invalid={Boolean(errors?.value)}
                    aria-describedby={valueErrorId}
                    onChange={(event) => handleRowChange(row.id, 'value', event.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors?.value ? (
                    <small id={valueErrorId} className="tag-editor__field-error">
                      {errors.value}
                    </small>
                  ) : null}
                </div>
                <Button
                  type="button"
                  icon="pi pi-trash"
                  className="tag-editor__remove"
                  onClick={() => handleRemoveRow(row.id)}
                  severity="danger"
                  rounded
                  text
                  disabled={isSubmitting}
                  aria-label={`Remove tag ${row.key || `#${index + 1}`}`}
                />
              </div>
            );
          })
        ) : (
          <p className="tag-editor__empty" aria-live="polite">
            No tags yet. Add your first tag to describe this feature.
          </p>
        )}
      </div>
      <div className="tag-editor__actions">
        <Button
          type="button"
          label="Add tag"
          icon="pi pi-plus"
          onClick={handleAddRow}
          outlined
          disabled={isSubmitting}
        />
        <span className="tag-editor__spacer" aria-hidden="true" />
        <Button type="submit" label="Save tags" icon="pi pi-check" loading={isSubmitting} />
        <Button
          type="button"
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          outlined
          onClick={onCancel}
          disabled={isSubmitting}
        />
      </div>
      {combinedError ? (
        <div className="tag-editor__error" role="alert">
          {combinedError}
        </div>
      ) : null}
    </form>
  );
}
