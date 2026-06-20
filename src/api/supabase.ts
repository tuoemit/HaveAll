export interface SupabaseConfig {
  id: number;
  type: string;
  raw_content: string;
  remarks: string | null;
  created_at: string;
}

export interface SupabaseProxy {
  id: number;
  server: string;
  port: number;
  secret: string;
  tg_link: string;
  created_at: string;
}

export interface SupabaseChannel {
  id: number;
  username: string;
  created_at: string;
}

export interface SupabaseSubscription {
  id: number;
  url: string;
  remarks: string | null;
  created_at: string;
}

class SupabaseClient {
  private baseUrl = '';
  private apiKey = '';

  configure(url: string, key: string) {
    this.baseUrl = url.endsWith('/') ? url : `${url}/`;
    this.apiKey = key;
  }

  private headers() {
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getConfigs(limit = 20, offset = 0): Promise<SupabaseConfig[]> {
    const res = await fetch(
      `${this.baseUrl}rest/v1/configs?select=*&limit=${limit}&offset=${offset}&order=created_at.desc`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getProxies(limit = 20, offset = 0): Promise<SupabaseProxy[]> {
    const res = await fetch(
      `${this.baseUrl}rest/v1/proxies?select=*&limit=${limit}&offset=${offset}&order=created_at.desc`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getMonitoredChannels(): Promise<SupabaseChannel[]> {
    const res = await fetch(
      `${this.baseUrl}rest/v1/monitored_channels?select=*&order=username.asc`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async addMonitoredChannel(username: string): Promise<SupabaseChannel[]> {
    const res = await fetch(`${this.baseUrl}rest/v1/monitored_channels`, {
      method: 'POST',
      headers: { ...this.headers(), Prefer: 'return=representation' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async deleteMonitoredChannel(username: string) {
    const res = await fetch(
      `${this.baseUrl}rest/v1/monitored_channels?username=eq.${username}`,
      { method: 'DELETE', headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async getSubscriptions(): Promise<SupabaseSubscription[]> {
    const res = await fetch(
      `${this.baseUrl}rest/v1/subscriptions?select=*&order=remarks.asc`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async addSubscription(url: string, remarks: string): Promise<SupabaseSubscription[]> {
    const res = await fetch(`${this.baseUrl}rest/v1/subscriptions`, {
      method: 'POST',
      headers: { ...this.headers(), Prefer: 'return=representation' },
      body: JSON.stringify({ url, remarks }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async deleteSubscription(url: string) {
    const res = await fetch(
      `${this.baseUrl}rest/v1/subscriptions?url=eq.${encodeURIComponent(url)}`,
      { method: 'DELETE', headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}

export const api = new SupabaseClient();
