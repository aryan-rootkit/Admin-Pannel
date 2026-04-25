const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email is required";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address";
  return null;
}

/** Exactly 10 digits (required). */
export function validateContactTenDigits(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return "Contact must be exactly 10 digits";
  return null;
}

export function validateProjectName(value: string): string | null {
  if (!value.trim()) return "Name is required";
  return null;
}

export function validateClientId(clientId: string): string | null {
  if (!clientId.trim()) return "Client is required";
  return null;
}

export function validateBudgetPositive(n: number | undefined | null): string | null {
  if (n == null || Number.isNaN(n)) return "Budget is required";
  if (n <= 0) return "Budget must be greater than 0";
  return null;
}

export function validatePersonName(value: string): string | null {
  if (!value.trim()) return "Name is required";
  return null;
}

export function validateRole(role: string): string | null {
  if (!role.trim()) return "Role is required";
  return null;
}

export function validateAmountPositive(n: number | undefined | null): string | null {
  if (n == null || Number.isNaN(n)) return "Amount is required";
  if (n <= 0) return "Amount must be greater than 0";
  return null;
}

export function validatePayoutProject(projectId: string, kindIsSubscription: boolean): string | null {
  if (kindIsSubscription) return null;
  if (!projectId.trim()) return "Project is required";
  return null;
}

export function validatePayoutPerson(peopleId: string, kindIsSubscription: boolean): string | null {
  if (kindIsSubscription) return null;
  if (!peopleId.trim()) return "Person is required";
  return null;
}

export function validatePayoutKind(kind: string): string | null {
  if (!kind.trim()) return "Kind is required";
  return null;
}
