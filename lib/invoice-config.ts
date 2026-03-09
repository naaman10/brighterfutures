import { readFileSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";

export type InvoiceConfig = {
  logo_url: string;
  billing_account_name: string;
  billing_account_number: string;
  billing_sort_code: string;
  terms: string;
};

let cached: InvoiceConfig | null = null;

const DEFAULT_CONFIG: InvoiceConfig = {
  logo_url: "",
  billing_account_name: "",
  billing_account_number: "",
  billing_sort_code: "",
  terms: "",
};

function loadConfig(): InvoiceConfig {
  if (cached) return cached;
  try {
    const path = join(process.cwd(), "config", "invoice.yaml");
    const raw = readFileSync(path, "utf-8");
    const parsed = parseYaml(raw) as Partial<InvoiceConfig>;
    cached = {
      logo_url: parsed?.logo_url ?? "",
      billing_account_name: parsed?.billing_account_name ?? "",
      billing_account_number: parsed?.billing_account_number ?? "",
      billing_sort_code: parsed?.billing_sort_code ?? "",
      terms: parsed?.terms ?? "",
    };
  } catch {
    cached = { ...DEFAULT_CONFIG };
  }
  return cached;
}

/**
 * Returns invoice branding/config. Cached after first load.
 */
export function getInvoiceConfig(): InvoiceConfig {
  return loadConfig();
}
