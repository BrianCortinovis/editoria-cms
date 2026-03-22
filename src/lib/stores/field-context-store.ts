import { create } from 'zustand';

export interface SelectedField {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'number' | 'url' | 'password' | 'other';
  label?: string;
  placeholder?: string;
}

export interface PageContext {
  pageName?: string;
  pageTitle?: string;
  url?: string;
  allFields?: Record<string, string>; // All fields on the page for AI context
  [key: string]: any;
}

interface FieldContextStore {
  selectedField: SelectedField | null;
  pageContext: PageContext;
  setSelectedField: (field: SelectedField | null) => void;
  setPageContext: (context: PageContext) => void;
  updatePageContext: (partial: Partial<PageContext>) => void;
  clearSelection: () => void;
}

export const useFieldContextStore = create<FieldContextStore>((set) => ({
  selectedField: null,
  pageContext: {},

  setSelectedField: (field) => set({ selectedField: field }),

  setPageContext: (context) => set({ pageContext: context }),

  updatePageContext: (partial) =>
    set((state) => ({
      pageContext: { ...state.pageContext, ...partial },
    })),

  clearSelection: () => set({ selectedField: null }),
}));

/**
 * Hook to automatically capture field selection on input/textarea/select focus
 */
export function useFieldCapture() {
  const { setSelectedField, updatePageContext } = useFieldContextStore();

  const captureField = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const field: SelectedField = {
      id: element.id || element.name || 'unknown',
      name: element.name || element.id || 'unknown',
      value: element.value || '',
      type: (element.getAttribute('type') || 'text') as any,
      label: element.getAttribute('aria-label') || undefined,
      placeholder: element.getAttribute('placeholder') || undefined,
    };

    setSelectedField(field);

    // Try to collect page context
    const formElement = element.closest('form') || element.closest('[data-form]') || document;
    const allFields: Record<string, string> = {};

    const inputs = formElement.querySelectorAll('input[name], textarea[name], select[name]');
    inputs.forEach((input: any) => {
      if (input.name && input.value) {
        allFields[input.name] = input.value;
      }
    });

    updatePageContext({
      allFields,
      pageName: document.title,
    });
  };

  return { captureField };
}
