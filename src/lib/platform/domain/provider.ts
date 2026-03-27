import type { DomainStatus } from "@/lib/platform/types";

export interface DnsRecordInstruction {
  type: "A" | "AAAA" | "CNAME" | "TXT";
  name: string;
  value: string;
  ttl?: number;
  purpose: "verification" | "routing" | "redirect";
}

export interface AttachDomainInput {
  siteId: string;
  tenantId: string;
  hostname: string;
  isPrimary?: boolean;
  redirectWww?: boolean;
}

export interface DomainProviderResult {
  externalId?: string;
  status: DomainStatus;
  dnsRecords: DnsRecordInstruction[];
  verificationToken?: string;
  metadata?: Record<string, unknown>;
}

export interface DomainSslStatus {
  status: "pending" | "provisioning" | "active" | "failed";
  message?: string;
}

export interface DomainProvider {
  readonly name: "vercel" | "vps";
  attachDomain(input: AttachDomainInput): Promise<DomainProviderResult>;
  verifyDomain(hostname: string): Promise<DomainProviderResult>;
  getDnsInstructions(hostname: string): Promise<DnsRecordInstruction[]>;
  checkSslStatus(hostname: string): Promise<DomainSslStatus>;
  removeDomain(hostname: string): Promise<void>;
  setPrimaryDomain(input: { siteId: string; hostname: string }): Promise<void>;
}
