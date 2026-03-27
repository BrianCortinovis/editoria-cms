import { resolve4, resolveCname, resolveTxt } from "node:dns/promises";
import { getPlatformBaseDomain } from "@/lib/platform/constants";
import type {
  AttachDomainInput,
  DnsRecordInstruction,
  DomainProvider,
  DomainProviderResult,
  DomainSslStatus,
} from "@/lib/platform/domain/provider";

function buildVerificationToken(hostname: string): string {
  return `editoria-verify-${Buffer.from(hostname).toString("hex").slice(0, 16)}`;
}

async function hasTxtRecord(name: string, expectedValue: string): Promise<boolean> {
  try {
    const records = await resolveTxt(name);
    return records.some((entry) => entry.join("") === expectedValue);
  } catch {
    return false;
  }
}

async function hasCnameRecord(name: string, expectedValue: string): Promise<boolean> {
  try {
    const records = await resolveCname(name);
    return records.some((value) => value.replace(/\.$/, "") === expectedValue.replace(/\.$/, ""));
  } catch {
    return false;
  }
}

async function hasARecord(name: string, expectedValue: string): Promise<boolean> {
  try {
    const records = await resolve4(name);
    return records.includes(expectedValue);
  } catch {
    return false;
  }
}

export class VpsDomainProvider implements DomainProvider {
  readonly name = "vps" as const;

  async attachDomain(input: AttachDomainInput): Promise<DomainProviderResult> {
    const verificationToken = buildVerificationToken(input.hostname);
    const targetHost = process.env.PLATFORM_VPS_CNAME_TARGET || `sites.${getPlatformBaseDomain()}`;
    const aRecordTarget = process.env.PLATFORM_VPS_A_RECORD || "";
    const dnsRecords: DnsRecordInstruction[] = [
      {
        type: "TXT",
        name: `_editoria.${input.hostname}`,
        value: verificationToken,
        purpose: "verification",
      },
    ];

    if (aRecordTarget) {
      dnsRecords.push({
        type: "A",
        name: input.hostname,
        value: aRecordTarget,
        purpose: "routing",
      });
    } else {
      dnsRecords.push({
        type: "CNAME",
        name: input.hostname,
        value: targetHost,
        purpose: "routing",
      });
    }

    return {
      status: "pending",
      verificationToken,
      dnsRecords,
      metadata: {
        targetHost,
      },
    };
  }

  async verifyDomain(hostname: string): Promise<DomainProviderResult> {
    const verificationToken = buildVerificationToken(hostname);
    const verificationName = `_editoria.${hostname}`;
    const targetHost = process.env.PLATFORM_VPS_CNAME_TARGET || `sites.${getPlatformBaseDomain()}`;
    const aRecordTarget = process.env.PLATFORM_VPS_A_RECORD || "";

    const txtOk = await hasTxtRecord(verificationName, verificationToken);
    const routingOk = aRecordTarget
      ? await hasARecord(hostname, aRecordTarget)
      : await hasCnameRecord(hostname, targetHost);

    return {
      status: txtOk && routingOk ? "active" : "verifying",
      verificationToken,
      dnsRecords: await this.getDnsInstructions(hostname),
      metadata: {
        txtOk,
        routingOk,
        targetHost,
      },
    };
  }

  async getDnsInstructions(hostname: string): Promise<DnsRecordInstruction[]> {
    const verificationToken = buildVerificationToken(hostname);
    const targetHost = process.env.PLATFORM_VPS_CNAME_TARGET || `sites.${getPlatformBaseDomain()}`;
    const aRecordTarget = process.env.PLATFORM_VPS_A_RECORD || "";

    const dnsRecords: DnsRecordInstruction[] = [
      {
        type: "TXT",
        name: `_editoria.${hostname}`,
        value: verificationToken,
        purpose: "verification",
      },
    ];

    if (aRecordTarget) {
      dnsRecords.push({
        type: "A",
        name: hostname,
        value: aRecordTarget,
        purpose: "routing",
      });
    } else {
      dnsRecords.push({
        type: "CNAME",
        name: hostname,
        value: targetHost,
        purpose: "routing",
      });
    }

    return dnsRecords;
  }

  async checkSslStatus(hostname: string): Promise<DomainSslStatus> {
    const verification = await this.verifyDomain(hostname);
    return verification.status === "active"
      ? { status: "active" }
      : { status: "pending", message: "Il certificato SSL verra` considerato attivo dopo la verifica DNS." };
  }

  async removeDomain(): Promise<void> {
    return;
  }

  async setPrimaryDomain(): Promise<void> {
    return;
  }
}
