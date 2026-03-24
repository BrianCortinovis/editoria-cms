import { create } from 'zustand';

type SupportedFieldElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLButtonElement;

interface FieldOption {
  value: string;
  label: string;
}

export interface SelectedField {
  id: string;
  name: string;
  value: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'email'
    | 'number'
    | 'url'
    | 'password'
    | 'date'
    | 'datetime-local'
    | 'tel'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'other';
  label?: string;
  placeholder?: string;
  htmlTag?: 'input' | 'textarea' | 'select' | 'button';
  options?: FieldOption[];
  checked?: boolean;
}

export interface PageContext {
  pageName?: string;
  pageTitle?: string;
  url?: string;
  path?: string;
  allFields?: Record<string, string>; // All fields on the page for AI context
  [key: string]: unknown;
}

interface FieldContextStore {
  selectedField: SelectedField | null;
  pageContext: PageContext;
  setSelectedField: (field: SelectedField | null) => void;
  setPageContext: (context: PageContext) => void;
  updatePageContext: (partial: Partial<PageContext>) => void;
  clearSelection: () => void;
  // AI field setters - allow AI to populate form fields
  fieldSetters: Record<string, (value: string) => void>;
  registerFieldSetter: (fieldName: string, setter: (value: string) => void) => void;
  unregisterFieldSetter: (fieldName: string) => void;
  setFieldValue: (fieldName: string, value: string) => void;
  captureFieldElement: (element: SupportedFieldElement) => void;
  syncFieldElement: (element: SupportedFieldElement) => void;
  applyValueToSelectedField: (value: string) => boolean;
  hasSelectedFieldTarget: () => boolean;
}

const UNSUPPORTED_INPUT_TYPES = new Set([
  'button',
  'color',
  'file',
  'hidden',
  'image',
  'range',
  'reset',
  'submit',
]);

let activeFieldElement: SupportedFieldElement | null = null;

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, ' ').trim() || '';
}

type ReactTrackedElement = HTMLElement & {
  _valueTracker?: {
    getValue?: () => string;
    setValue?: (value: string) => void;
  };
};

function isSwitchButtonElement(element: EventTarget | null): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement && element.getAttribute('role') === 'switch';
}

function getFieldIdentity(element: SupportedFieldElement) {
  const fallbackLabel = inferFieldLabel(element) || 'unknown';
  const baseId = element.id || element.getAttribute('name') || element.getAttribute('data-field-name');
  const baseName = element.getAttribute('name') || element.id || element.getAttribute('data-field-name');

  return {
    id: baseId || fallbackLabel,
    name: baseName || fallbackLabel,
  };
}

function inferFieldLabel(element: SupportedFieldElement) {
  if (element.getAttribute('aria-label')) {
    return normalizeText(element.getAttribute('aria-label'));
  }

  if (element.id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (forLabel?.textContent) {
      return normalizeText(forLabel.textContent);
    }
  }

  const closestLabel = element.closest('label');
  if (closestLabel?.textContent) {
    return normalizeText(closestLabel.textContent);
  }

  const parent = element.parentElement;
  const siblingLabel = parent?.querySelector('label');
  if (siblingLabel?.textContent) {
    return normalizeText(siblingLabel.textContent);
  }

  return normalizeText(element.getAttribute('placeholder'));
}

function collectFieldOptions(element: SupportedFieldElement): FieldOption[] | undefined {
  if (element instanceof HTMLSelectElement) {
    const options = Array.from(element.options)
      .map((option) => ({
        value: option.value,
        label: normalizeText(option.textContent) || option.value,
      }))
      .filter((option) => option.value || option.label);

    return options.length > 0 ? options : undefined;
  }

  if (element instanceof HTMLInputElement && element.type === 'radio' && element.name) {
    const scopeRoot = element.form || document;
    const radioOptions = Array.from(scopeRoot.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`))
      .filter((radio): radio is HTMLInputElement => radio instanceof HTMLInputElement)
      .map((radio) => ({
        value: radio.value,
        label: inferFieldLabel(radio) || radio.value,
      }));

    return radioOptions.length > 0 ? radioOptions : undefined;
  }

  if (element instanceof HTMLInputElement && element.type === 'checkbox') {
    return [
      { value: 'true', label: 'Attivo' },
      { value: 'false', label: 'Disattivo' },
    ];
  }

  if (isSwitchButtonElement(element)) {
    return [
      { value: 'true', label: 'Attivo' },
      { value: 'false', label: 'Disattivo' },
    ];
  }

  return undefined;
}

function getFieldValue(element: SupportedFieldElement) {
  if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
    return element.checked ? (element.value || 'true') : element.type === 'checkbox' ? 'false' : '';
  }

  if (isSwitchButtonElement(element)) {
    return element.getAttribute('aria-checked') === 'true' ? 'true' : 'false';
  }

  return element.value || '';
}

function extractFieldType(element: SupportedFieldElement): SelectedField['type'] {
  if (isSwitchButtonElement(element)) {
    return 'switch';
  }

  if (element instanceof HTMLTextAreaElement) {
    return 'textarea';
  }

  if (element instanceof HTMLSelectElement) {
    return 'select';
  }

  const type = (element.getAttribute('type') || 'text').toLowerCase();
  if (
    type === 'email'
    || type === 'number'
    || type === 'url'
    || type === 'password'
    || type === 'text'
    || type === 'date'
    || type === 'datetime-local'
    || type === 'tel'
    || type === 'checkbox'
    || type === 'radio'
  ) {
    return type;
  }

  return 'other';
}

function buildSelectedField(element: SupportedFieldElement): SelectedField {
  const identity = getFieldIdentity(element);
  const checked = element instanceof HTMLInputElement
    ? (element.type === 'checkbox' || element.type === 'radio' ? element.checked : undefined)
    : isSwitchButtonElement(element)
      ? element.getAttribute('aria-checked') === 'true'
      : undefined;

  return {
    id: identity.id,
    name: identity.name,
    value: getFieldValue(element),
    type: extractFieldType(element),
    label: inferFieldLabel(element),
    placeholder: element.getAttribute('placeholder') || undefined,
    htmlTag: element instanceof HTMLTextAreaElement
      ? 'textarea'
      : element instanceof HTMLSelectElement
        ? 'select'
        : isSwitchButtonElement(element)
          ? 'button'
          : 'input',
    options: collectFieldOptions(element),
    checked,
  };
}

function collectPageContext(element: SupportedFieldElement): PageContext {
  const formElement = element.closest('form') || element.closest('[data-form]') || document;
  const allFields: Record<string, string> = {};
  const inputs = formElement.querySelectorAll('input, textarea, select, button[role="switch"]');

  inputs.forEach((input) => {
    if (!isFillableFieldElement(input)) {
      return;
    }

    const identity = getFieldIdentity(input);
    const key = identity.name || identity.id || inferFieldLabel(input) || input.getAttribute('placeholder') || input.tagName.toLowerCase();
    const value = getFieldValue(input);

    if (key && value !== '') {
      allFields[key] = value;
    }
  });

  return {
    allFields,
    pageName: document.title,
    pageTitle: document.title,
    path: window.location.pathname,
    url: window.location.href,
  };
}

function setNativeElementValue(element: SupportedFieldElement, value: string) {
  if (element instanceof HTMLInputElement && element.type === 'checkbox') {
    setCheckableElementState(element, shouldEnableBooleanValue(value));
    return;
  }

  if (element instanceof HTMLInputElement && element.type === 'radio') {
    setRadioElementValue(element, value);
    return;
  }

  if (isSwitchButtonElement(element)) {
    setSwitchButtonValue(element, value);
    return;
  }

  const normalizedValue = element instanceof HTMLSelectElement
    ? resolveSelectValue(element, value)
    : value;
  const previousValue = element.value;

  const prototype = Object.getPrototypeOf(element) as { constructor?: { name?: string } };
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (valueSetter) {
    valueSetter.call(element, normalizedValue);
  } else {
    element.value = normalizedValue;
  }

  const tracker = (element as ReactTrackedElement)._valueTracker;
  tracker?.setValue?.(previousValue);

  try {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: normalizedValue }));
  } catch {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function shouldEnableBooleanValue(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  return ['true', '1', 'yes', 'si', 'sì', 'on', 'enabled', 'attivo', 'abilita', 'abilitato'].includes(normalized);
}

function setCheckableElementState(element: HTMLInputElement, nextChecked: boolean) {
  const previousValue = element.checked ? 'true' : 'false';
  const prototype = Object.getPrototypeOf(element) as { constructor?: { name?: string } };
  const checkedSetter = Object.getOwnPropertyDescriptor(prototype, 'checked')?.set;

  if (checkedSetter) {
    checkedSetter.call(element, nextChecked);
  } else {
    element.checked = nextChecked;
  }

  const tracker = (element as ReactTrackedElement)._valueTracker;
  tracker?.setValue?.(previousValue);

  try {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: nextChecked ? 'true' : 'false' }));
  } catch {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function setRadioElementValue(element: HTMLInputElement, value: string) {
  const scopeRoot = element.form || document;
  const compactValue = normalizeText(value).toLowerCase();
  const options = Array.from(scopeRoot.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`))
    .filter((radio): radio is HTMLInputElement => radio instanceof HTMLInputElement);

  const match = options.find((radio) => {
    const optionValue = normalizeText(radio.value).toLowerCase();
    const optionLabel = normalizeText(inferFieldLabel(radio)).toLowerCase();
    return optionValue === compactValue || optionLabel === compactValue;
  });

  if (!match) {
    return;
  }

  options.forEach((radio) => {
    setCheckableElementState(radio, radio === match);
  });
}

function setSwitchButtonValue(element: HTMLButtonElement, value: string) {
  const nextChecked = shouldEnableBooleanValue(value);
  const currentChecked = element.getAttribute('aria-checked') === 'true';

  if (currentChecked !== nextChecked) {
    element.click();
  }
}

function resolveSelectValue(element: HTMLSelectElement, value: string) {
  const compactValue = normalizeText(value).toLowerCase();
  const firstLine = compactValue.split('\n')[0]?.trim() || compactValue;
  const normalizeLoose = (input: string) => normalizeText(input).toLowerCase().replace(/[^a-z0-9àèéìíîòóùúçñ\s-]/gi, '').trim();
  const compactLoose = normalizeLoose(compactValue);
  const firstLineLoose = normalizeLoose(firstLine);

  const match = Array.from(element.options).find((option) => {
    const optionValue = option.value.toLowerCase();
    const optionLabel = normalizeText(option.textContent).toLowerCase();
    const optionValueLoose = normalizeLoose(option.value);
    const optionLabelLoose = normalizeLoose(option.textContent || '');
    return optionValue === compactValue
      || optionLabel === compactValue
      || optionValue === firstLine
      || optionLabel === firstLine
      || (optionValueLoose && (compactLoose.includes(optionValueLoose) || firstLineLoose.includes(optionValueLoose)))
      || (optionLabelLoose && (compactLoose.includes(optionLabelLoose) || firstLineLoose.includes(optionLabelLoose)))
      || (optionValueLoose && (optionValueLoose.includes(compactLoose) || optionValueLoose.includes(firstLineLoose)))
      || (optionLabelLoose && (optionLabelLoose.includes(compactLoose) || optionLabelLoose.includes(firstLineLoose)));
  });

  return match?.value ?? value.trim();
}

function findSelectedElement(field: SelectedField | null) {
  if (activeFieldElement && document.contains(activeFieldElement)) {
    return activeFieldElement;
  }

  if (!field) {
    return null;
  }

  if (field.id && field.id !== 'unknown') {
    const byId = document.getElementById(field.id);
    if (isFillableFieldElement(byId)) {
      return byId;
    }
  }

  if (field.name && field.name !== 'unknown') {
    const byName = document.querySelector(`[name="${CSS.escape(field.name)}"], [data-field-name="${CSS.escape(field.name)}"]`);
    if (isFillableFieldElement(byName)) {
      return byName;
    }
  }

  return null;
}

export function isFillableFieldElement(target: EventTarget | null): target is SupportedFieldElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest('[data-ai-ignore-field-context="true"]')) {
    return false;
  }

  if (target instanceof HTMLInputElement) {
    const type = (target.type || 'text').toLowerCase();
    if (UNSUPPORTED_INPUT_TYPES.has(type) || target.readOnly || target.disabled) {
      return false;
    }
    return true;
  }

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return !target.disabled;
  }

  if (isSwitchButtonElement(target)) {
    return !target.disabled;
  }

  return false;
}

export const useFieldContextStore = create<FieldContextStore>((set, get) => ({
  selectedField: null,
  pageContext: {},
  fieldSetters: {},

  setSelectedField: (field) => set({ selectedField: field }),

  setPageContext: (context) => set({ pageContext: context }),

  updatePageContext: (partial) =>
    set((state) => ({
      pageContext: { ...state.pageContext, ...partial },
    })),

  clearSelection: () => set({ selectedField: null }),

  registerFieldSetter: (fieldName, setter) =>
    set((state) => ({
      fieldSetters: { ...state.fieldSetters, [fieldName]: setter },
    })),

  unregisterFieldSetter: (fieldName) =>
    set((state) => {
      const nextSetters = { ...state.fieldSetters };
      delete nextSetters[fieldName];
      return { fieldSetters: nextSetters };
    }),

  setFieldValue: (fieldName, value) => {
    const setter = get().fieldSetters[fieldName];
    if (setter) {
      setter(value);
    }
  },

  captureFieldElement: (element) => {
    activeFieldElement = element;
    set({
      selectedField: buildSelectedField(element),
      pageContext: collectPageContext(element),
    });
  },

  syncFieldElement: (element) => {
    if (!document.contains(element)) {
      return;
    }

    const current = get().selectedField;
    const sameField = current
      && current.id === getFieldIdentity(element).id
      && current.name === getFieldIdentity(element).name;

    if (!sameField && activeFieldElement !== element) {
      return;
    }

    activeFieldElement = element;
    set({
      selectedField: buildSelectedField(element),
      pageContext: collectPageContext(element),
    });
  },

  applyValueToSelectedField: (value) => {
    const { selectedField, fieldSetters } = get();

    if (!selectedField) {
      return false;
    }

    const setterCandidates = [
      selectedField.name,
      selectedField.id,
      selectedField.label,
    ].filter(Boolean) as string[];

    for (const candidate of setterCandidates) {
      const setter = fieldSetters[candidate];
      if (setter) {
        setter(value);
        const element = findSelectedElement(selectedField);
        if (element) {
          activeFieldElement = element;
          set({
            selectedField: { ...buildSelectedField(element), value },
            pageContext: collectPageContext(element),
          });
        } else {
          set((state) => ({
            selectedField: state.selectedField ? { ...state.selectedField, value } : state.selectedField,
          }));
        }
        return true;
      }
    }

    const element = findSelectedElement(selectedField);
    if (!element) {
      return false;
    }

    setNativeElementValue(element, value);
    activeFieldElement = element;
    set({
      selectedField: buildSelectedField(element),
      pageContext: collectPageContext(element),
    });
    return true;
  },

  hasSelectedFieldTarget: () => {
    return Boolean(findSelectedElement(get().selectedField));
  },
}));

/**
 * Hook to automatically capture field selection on input/textarea/select focus
 */
export function useFieldCapture() {
  const { captureFieldElement } = useFieldContextStore();

  const captureField = (element: SupportedFieldElement) => {
    captureFieldElement(element);
  };

  return { captureField };
}
