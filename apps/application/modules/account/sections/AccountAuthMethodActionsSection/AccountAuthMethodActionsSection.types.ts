export type AccountAuthMethodActionsSectionProps = {
  formId: string;
  submitLabel: string;
  alternateLabel: string;
  orLabel: string;
  isBusy?: boolean;
  isPending?: boolean;
  showAlternate?: boolean;
  onAlternatePress: () => void;
};
