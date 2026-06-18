export function isValidCpf(cpfStr: string): boolean {
  const cleanCpf = cpfStr.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // Bloqueia CPFs com dígitos todos repetidos
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;
  return true;
}

export function isValidCnpj(cnpjStr: string): boolean {
  const cleanCnpj = cnpjStr.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

  let size = cleanCnpj.length - 2;
  let numbers = cleanCnpj.substring(0, size);
  const digits = cleanCnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export function formatCpf(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  let masked = '';
  if (digits.length > 0) masked += digits.slice(0, 3);
  if (digits.length > 3) masked += '.' + digits.slice(3, 6);
  if (digits.length > 6) masked += '.' + digits.slice(6, 9);
  if (digits.length > 9) masked += '-' + digits.slice(9, 11);
  return masked;
}

export function formatCnpj(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  let masked = '';
  if (digits.length > 0) masked += digits.slice(0, 2);
  if (digits.length > 2) masked += '.' + digits.slice(2, 5);
  if (digits.length > 5) masked += '.' + digits.slice(5, 8);
  if (digits.length > 8) masked += '/' + digits.slice(8, 12);
  if (digits.length > 12) masked += '-' + digits.slice(12, 14);
  return masked;
}

export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  let masked = '';
  if (digits.length > 0) {
    masked += '(' + digits.slice(0, 2);
  }
  if (digits.length > 2) {
    masked += ') ' + digits.slice(2, 7);
  }
  if (digits.length > 7) {
    masked += '-' + digits.slice(7, 11);
  }
  return masked;
}

export function formatCep(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  let masked = '';
  if (digits.length > 0) masked += digits.slice(0, 5);
  if (digits.length > 5) masked += '-' + digits.slice(5, 8);
  return masked;
}
