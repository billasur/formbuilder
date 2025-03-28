export enum FieldKindEnum {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SELECT = 'select',
  DATE = 'date',
  TIME = 'time',
  FILE = 'file',
  SIGNATURE = 'signature',
  HEADING = 'heading',
  DIVIDER = 'divider',
  IMAGE = 'image',
  PAGE_BREAK = 'page_break',
  MULTIPLE_CHOICE = 'multiple_choice',
  PICTURE_CHOICE = 'picture_choice',
  RATING = 'rating',
  OPINION_SCALE = 'opinion_scale',
  YES_NO = 'yes_no',
  DATE_RANGE = 'date_range',
  PHONE_NUMBER = 'phone_number',
  INPUT_TABLE = 'input_table',
  PAYMENT = 'payment',
  GROUP = 'group',
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  FULL_NAME = 'full_name',
  STATEMENT = 'statement'
}

export enum CaptchaKindEnum {
  NONE = 'none',
  GOOGLE_RECAPTCHA = 'google_recaptcha',
  GEETEST_CAPTCHA = 'geetest_captcha'
}

export interface FormTheme {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  borderRadius?: number;
  logoUrl?: string;
  customCSS?: string;
}

export interface FormSettings {
  locale: string;
  captchaKind: 'none' | 'recaptcha' | 'hcaptcha';
  requirePassword?: boolean;
  password?: string;
  submitButtonText?: string;
  successMessage?: string;
  redirectAfterSubmit?: string;
  collectEmailAddresses?: boolean;
  limitResponses?: boolean;
  maxResponses?: number;
  closedMessage?: string;
  showProgressBar?: boolean;
  confirmationMessage?: string;
  redirectUrl?: string;
  allowMultipleSubmissions?: boolean;
  enableCaptcha?: boolean;
  category?: string;
  tags?: string[];
  thumbnail?: string;
}

export interface FormValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
}

export interface FieldChoice {
  id: string;
  label: string;
  value?: string;
  imageUrl?: string;
}

export interface TableColumn {
  id: string;
  label: string;
}

export interface FieldProperties {
  allowMultiple?: boolean;
  choices?: { id: string; label: string; value?: string }[];
  total?: number;
  shape?: 'star' | 'heart' | 'thumb';
  format?: string;
  allowTime?: boolean;
  defaultCountryCode?: string;
  tableColumns?: TableColumn[];
  currency?: string;
  price?: {
    type: 'number' | 'variable';
    value: number;
  };
  fields?: FormField[];
}

export interface FormField {
  id: string;
  kind: FieldKindEnum;
  label: string;
  title?: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  description?: string;
  defaultValue?: any;
  validations?: any;
  properties?: FieldProperties;
}

export interface HiddenField {
  id: string;
  name: string;
  value: string;
}

export interface FormModel {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  fields: FormField[];
  hiddenFields?: HiddenField[];
  settings: FormSettings;
  themeSettings?: {
    theme: FormTheme;
  };
  logic?: any[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  accessType?: 'public' | 'private' | 'restricted';
  collaborators?: string[];
  views?: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  submittedBy?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  submittedBy?: string;
} 