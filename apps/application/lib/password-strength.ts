export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrengthLabel =
  | "empty"
  | "weak"
  | "fair"
  | "good"
  | "strong";

export type PasswordStrength = {
  score: PasswordStrengthLevel;
  label: PasswordStrengthLabel;
};

function countCriteria(password: string): number {
  let count = 0;

  if (password.length >= 8) {
    count += 1;
  }
  if (password.length >= 12) {
    count += 1;
  }
  if (/[a-z\u0600-\u06FF]/.test(password)) {
    count += 1;
  }
  if (/[A-Z]/.test(password)) {
    count += 1;
  }
  if (/\d/.test(password)) {
    count += 1;
  }
  if (/[^A-Za-z0-9\u0600-\u06FF]/.test(password)) {
    count += 1;
  }

  return count;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "empty" };
  }

  const criteria = countCriteria(password);

  if (criteria <= 1) {
    return { score: 1, label: "weak" };
  }
  if (criteria === 2) {
    return { score: 2, label: "fair" };
  }
  if (criteria <= 4) {
    return { score: 3, label: "good" };
  }

  return { score: 4, label: "strong" };
}
