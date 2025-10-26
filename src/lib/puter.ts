// Puter.js client-side integration utilities

export interface PuterConfig {
  authToken?: string;
  apiBase?: string;
}

export interface PuterFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  createdAt: string;
  modifiedAt: string;
}

export interface PuterFolder {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  modifiedAt: string;
}

class PuterClient {
  private config: PuterConfig;
  private apiBase: string;

  constructor(config: PuterConfig = {}) {
    this.config = config;
    this.apiBase = config.apiBase || 'https://api.puter.com';
  }

  setAuthToken(token: string) {
    this.config.authToken = token;
  }

  getAuthToken(): string | undefined {
    return this.config.authToken;
  }

  // Upload a file to Puter
  async uploadFile(file: File, path?: string): Promise<PuterFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }

    const response = await fetch(`${this.apiBase}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.config.authToken ? `Bearer ${this.config.authToken}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  // Download a file from Puter
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.apiBase}/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.config.authToken ? `Bearer ${this.config.authToken}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return await response.blob();
  }

  // List files and folders in a directory
  async listFiles(path?: string): Promise<(PuterFile | PuterFolder)[]> {
    const url = path ? `${this.apiBase}/list?path=${encodeURIComponent(path)}` : `${this.apiBase}/list`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.config.authToken ? `Bearer ${this.config.authToken}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`List failed: ${response.status}`);
    }

    return await response.json();
  }

  // Delete a file or folder
  async deleteItem(fileId: string): Promise<void> {
    const response = await fetch(`${this.apiBase}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.config.authToken ? `Bearer ${this.config.authToken}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
  }

  // Create a folder
  async createFolder(name: string, path: string): Promise<PuterFolder> {
    const response = await fetch(`${this.apiBase}/folders`, {
      method: 'POST',
      headers: {
        'Authorization': this.config.authToken ? `Bearer ${this.config.authToken}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, path }),
    });

    if (!response.ok) {
      throw new Error(`Create folder failed: ${response.status}`);
    }

    return await response.json();
  }

  // Get authentication URL
  getAuthUrl(redirectUri?: string): string {
    const baseUrl = 'https://puter.com/auth';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_PUTER_CLIENT_ID || '',
      redirect_uri: redirectUri || `${window.location.origin}/auth/puter/callback`,
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Exchange auth code for access token
  async exchangeCodeForToken(code: string, redirectUri?: string): Promise<string> {
    const response = await fetch(`${this.apiBase}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_PUTER_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_PUTER_CLIENT_SECRET,
        redirect_uri: redirectUri || `${window.location.origin}/auth/puter/callback`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  // Save chat history to Puter
  async saveChatHistory(messages: any[], filename?: string): Promise<PuterFile> {
    const chatData = {
      messages,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const file = new File([blob], filename || `chat-${Date.now()}.json`, { type: 'application/json' });
    
    return await this.uploadFile(file, '/chat-history');
  }

  // Load chat history from Puter
  async loadChatHistory(fileId: string): Promise<any> {
    const blob = await this.downloadFile(fileId);
    const text = await blob.text();
    return JSON.parse(text);
  }

  // Export chat as text file
  async exportChatAsText(messages: any[], filename?: string): Promise<PuterFile> {
    const exportText = messages.map((m: any) => {
      const timestamp = new Date(m.timestamp).toLocaleString();
      const prefix = m.type === 'user' ? 'User' : 'Assistant';
      return `[${timestamp}] ${prefix}: ${m.content}`;
    }).join('\n\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const file = new File([blob], filename || `chat-export-${Date.now()}.txt`, { type: 'text/plain' });
    
    return await this.uploadFile(file, '/chat-exports');
  }

  // Upload generated image to Puter
  async uploadImage(imageDataUrl: string, filename?: string): Promise<PuterFile> {
    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    const file = new File([blob], filename || `generated-${Date.now()}.png`, { type: 'image/png' });
    
    return await this.uploadFile(file, '/generated-images');
  }
}

// Create singleton instance
export const puterClient = new PuterClient();

// React hook for Puter integration
export function usePuter(config?: PuterConfig) {
  const client = new PuterClient(config);
  
  return {
    uploadFile: client.uploadFile.bind(client),
    downloadFile: client.downloadFile.bind(client),
    listFiles: client.listFiles.bind(client),
    deleteItem: client.deleteItem.bind(client),
    createFolder: client.createFolder.bind(client),
    saveChatHistory: client.saveChatHistory.bind(client),
    loadChatHistory: client.loadChatHistory.bind(client),
    exportChatAsText: client.exportChatAsText.bind(client),
    uploadImage: client.uploadImage.bind(client),
    getAuthUrl: client.getAuthUrl.bind(client),
    exchangeCodeForToken: client.exchangeCodeForToken.bind(client),
    setAuthToken: client.setAuthToken.bind(client),
    getAuthToken: client.getAuthToken.bind(client),
  };
}

export default PuterClient;