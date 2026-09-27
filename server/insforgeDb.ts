import axios from 'axios';

const INSFORGE_BASE_URL = process.env.INSFORGE_BASE_URL || 'https://2y4k8jwr.us-east.insforge.app/api/database/records';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'ik_44baf229fbf982d963b2277e284be487';

const http = axios.create({
  baseURL: INSFORGE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': INSFORGE_API_KEY,
    'Authorization': `Bearer ${INSFORGE_API_KEY}`,
  },
  timeout: 10000,
});

// Helper to execute request with automatic retries on transient internal/connection errors
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 300): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

export const insforgeDb = {
  // Get all records or filter by query params
  async select<T = any>(table: string, params: Record<string, any> = {}): Promise<T[]> {
    try {
      return await withRetry(async () => {
        const formattedParams: Record<string, string> = {};
        if (params) {
          for (const [key, val] of Object.entries(params)) {
            if (val === undefined || val === null) continue;
            const strVal = String(val);
            if (key === 'limit' || key === 'offset' || key === 'order') {
              formattedParams[key] = strVal;
            } else if (/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|sl|sr|nxl|nxr|adj|ov|fts|plfts|phfts|wfts)\./.test(strVal)) {
              formattedParams[key] = strVal;
            } else {
              formattedParams[key] = `eq.${strVal}`;
            }
          }
        }
        const res = await http.get(`/${table}`, { params: formattedParams });
        return Array.isArray(res.data) ? res.data : [];
      });
    } catch (err: any) {
      console.warn(`InsForge DB select warning on table ${table}:`, err?.response?.data || err.message);
      return [];
    }
  },

  // Get total count of records matching query
  async count(table: string, params: Record<string, any> = {}): Promise<number> {
    try {
      return await withRetry(async () => {
        const formattedParams: Record<string, string> = { limit: '1' };
        if (params) {
          for (const [key, val] of Object.entries(params)) {
            if (val === undefined || val === null) continue;
            const strVal = String(val);
            if (key === 'limit' || key === 'offset') continue;
            if (/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|sl|sr|nxl|nxr|adj|ov|fts|plfts|phfts|wfts)\./.test(strVal)) {
              formattedParams[key] = strVal;
            } else {
              formattedParams[key] = `eq.${strVal}`;
            }
          }
        }
        const res = await http.get(`/${table}`, {
          params: formattedParams,
          headers: { 'Prefer': 'count=exact' },
        });
        const rangeHeader = res.headers['content-range'] || res.headers['Content-Range'];
        if (rangeHeader && typeof rangeHeader === 'string') {
          const parts = rangeHeader.split('/');
          if (parts[1]) {
            const total = parseInt(parts[1], 10);
            if (!isNaN(total)) return total;
          }
        }
        return Array.isArray(res.data) ? res.data.length : 0;
      });
    } catch (err: any) {
      console.warn(`InsForge DB count warning on table ${table}:`, err?.response?.data || err.message);
      return 0;
    }
  },

  // Get single record by id
  async selectOne<T = any>(table: string, id: string): Promise<T | null> {
    try {
      const records = await this.select<T>(table, { id });
      return records[0] || null;
    } catch (err) {
      return null;
    }
  },

  // Insert array or single object
  async insert<T = any>(table: string, recordOrArray: any): Promise<T[]> {
    try {
      const payload = Array.isArray(recordOrArray) ? recordOrArray : [recordOrArray];
      const res = await http.post(`/${table}`, payload);
      return Array.isArray(res.data) ? res.data : [res.data];
    } catch (err: any) {
      console.warn(`InsForge DB insert warning on table ${table}:`, err?.response?.data || err.message);
      return [];
    }
  },

  // Update record by id
  async update<T = any>(table: string, id: string, updates: Record<string, any>): Promise<T | null> {
    try {
      const cleanUpdates = { ...updates };
      delete cleanUpdates.id;
      const res = await http.patch(`/${table}?id=eq.${id}`, cleanUpdates);
      return res.data?.[0] || null;
    } catch (err: any) {
      console.error(`InsForge DB update error on table ${table}:`, err?.response?.data || err.message);
      return null;
    }
  },

  // Delete record by id or filter
  async delete(table: string, idOrParams: string | Record<string, any>): Promise<boolean> {
    try {
      const params = typeof idOrParams === 'string' ? { id: idOrParams } : idOrParams;
      const formattedParams: Record<string, string> = {};
      for (const [key, val] of Object.entries(params)) {
        if (val === undefined || val === null) continue;
        const strVal = String(val);
        if (/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|sl|sr|nxl|nxr|adj|ov|fts|plfts|phfts|wfts)\./.test(strVal)) {
          formattedParams[key] = strVal;
        } else {
          formattedParams[key] = `eq.${strVal}`;
        }
      }
      await http.delete(`/${table}`, { params: formattedParams });
      return true;
    } catch (err: any) {
      console.error(`InsForge DB delete error on table ${table}:`, err?.response?.data || err.message);
      return false;
    }
  },
};

export const insforgeStorage = {
  // Upload file buffer to InsForge Storage Bucket
  async upload(bucket: string, filename: string, buffer: Buffer, mimeType = 'image/png'): Promise<{ url: string; key: string } | null> {
    try {
      const form = new FormData();
      const blob = new Blob([buffer as any], { type: mimeType });
      form.append('file', blob, filename);

      const res = await axios.post(`https://nr5f6grt.us-east.insforge.app/api/storage/buckets/${bucket}/objects`, form, {
        headers: {
          'x-api-key': INSFORGE_API_KEY,
          'Authorization': `Bearer ${INSFORGE_API_KEY}`,
        },
        timeout: 15000,
      });

      if (res.data?.url) {
        return {
          url: res.data.url,
          key: res.data.key,
        };
      }
      return null;
    } catch (err: any) {
      console.error(`InsForge storage upload error on bucket ${bucket}:`, err?.response?.data || err.message);
      return null;
    }
  },
};

