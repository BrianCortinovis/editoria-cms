import type {
  AttachDomainInput,
  DnsRecordInstruction,
  DomainProvider,
  DomainProviderResult,
  DomainSslStatus,
} from "@/lib/platform/domain/provider";

function getVercelHeaders() {
  const token = process.env.VERCEL_API_KEY;
  if (!token) return null;

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getVercelProjectPath(): string | null {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) return null;
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId
    ? `https://api.vercel.com/v10/projects/${projectId}?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}`;
}

function getFallbackInstructions(hostname: string): DnsRecordInstruction[] {
  return [
    {
      type: "CNAME",
      name: hostname,
      value: "cname.vercel-dns.com",
      purpose: "routing",
    },
  ];
}

async function vercelFetch(path: string, init?: RequestInit) {
  const headers = getVercelHeaders();
  if (!headers) return null;

  const base = getVercelProjectPath();
  if (!base) return null;

  const prefix = base.replace(/\?.*$/, "");
  const query = base.includes("?") ? base.slice(base.indexOf("?")) : "";
  const response = await fetch(`${prefix}${path}${query}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Vercel domain request failed: ${response.status}`);
  }

  return response.json();
}

export class VercelDomainProvider implements DomainProvider {
  readonly name = "vercel" as const;

  async attachDomain(input: AttachDomainInput): Promise<DomainProviderResult> {
    if (!getVercelHeaders() || !getVercelProjectPath()) {
      return {
        status: "pending",
        dnsRecords: getFallbackInstructions(input.hostname),
      };
    }

    const payload = await vercelFetch("/domains", {
      method: "POST",
      body: JSON.stringify({
        name: input.hostname,
      }),
    });

    return {
      status: payload?.verified ? "active" : "verifying",
      dnsRecords: getFallbackInstructions(input.hostname),
      metadata: payload || {},
    };
  }

  async verifyDomain(hostname: string): Promise<DomainProviderResult> {
    if (!getVercelHeaders() || !getVercelProjectPath()) {
      return {
        status: "verifying",
        dnsRecords: getFallbackInstructions(hostname),
      };
    }

    const encodedName = encodeURIComponent(hostname);
    const payload = await vercelFetch(`/domains/${encodedName}/verify`, {
      method: "POST",
    });

    return {
      status: payload?.verified ? "active" : "verifying",
      dnsRecords: getFallbackInstructions(hostname),
      metadata: payload || {},
    };
  }

  async getDnsInstructions(hostname: string): Promise<DnsRecordInstruction[]> {
    return getFallbackInstructions(hostname);
  }

  async checkSslStatus(hostname: string): Promise<DomainSslStatus> {
    if (!getVercelHeaders() || !getVercelProjectPath()) {
      return { status: "pending", message: "Configura le credenziali Vercel per leggere lo stato SSL." };
    }

    const encodedName = encodeURIComponent(hostname);
    const payload = await vercelFetch(`/domains/${encodedName}`, {
      method: "GET",
    });

    const certState = payload?.certs?.[0]?.status || payload?.verification?.status;
    if (certState === "ISSUED" || certState === "valid" || certState === "active") {
      return { status: "active" };
    }

    if (certState === "failed" || certState === "error") {
      return { status: "failed", message: "Vercel segnala un problema con il certificato." };
    }

    return { status: "provisioning", message: "Certificato in provisioning su Vercel." };
  }

  async removeDomain(hostname: string): Promise<void> {
    if (!getVercelHeaders() || !getVercelProjectPath()) return;

    const encodedName = encodeURIComponent(hostname);
    await vercelFetch(`/domains/${encodedName}`, {
      method: "DELETE",
    });
  }

  async setPrimaryDomain(): Promise<void> {
    return;
  }
}
