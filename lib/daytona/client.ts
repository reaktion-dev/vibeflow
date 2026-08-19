import axios, { AxiosInstance, AxiosError } from 'axios';
import { getEnv } from '../env';

interface DaytonaConfig {
  apiKey: string;
  baseUrl: string;
}

class DaytonaClient {
  private client: AxiosInstance;
  private config: DaytonaConfig;

  constructor(config?: DaytonaConfig) {
    const env = getEnv();
    this.config = config || {
      apiKey: env.DAYTONA_API_KEY || 'demo-key',
      baseUrl: env.DAYTONA_API_BASE_URL || 'https://api.daytona.io',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined,
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new sandbox
   */
  async createSandbox(data: {
    name: string;
    project?: string;
    image?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/sandboxes', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get sandbox details
   */
  async getSandbox(sandboxId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/sandboxes/${sandboxId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * List all sandboxes
   */
  async listSandboxes(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/sandboxes');
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * Delete a sandbox
   */
  async deleteSandbox(sandboxId: string): Promise<void> {
    try {
      await this.client.delete(`/api/sandboxes/${sandboxId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Execute a command in the sandbox
   */
  async executeCommand(
    sandboxId: string,
    command: string,
    options?: {
      workingDirectory?: string;
      environment?: Record<string, string>;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/api/sandboxes/${sandboxId}/exec`,
        {
          command,
          workingDirectory: options?.workingDirectory || '/',
          environment: options?.environment || {},
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Read a file from the sandbox
   */
  async readFile(sandboxId: string, filePath: string): Promise<string> {
    try {
      const response = await this.client.get(
        `/api/sandboxes/${sandboxId}/files/${encodeURIComponent(filePath)}`
      );
      return response.data.content;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Write a file to the sandbox
   */
  async writeFile(
    sandboxId: string,
    filePath: string,
    content: string
  ): Promise<void> {
    try {
      await this.client.post(`/api/sandboxes/${sandboxId}/files`, {
        path: filePath,
        content,
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a file from the sandbox
   */
  async deleteFile(sandboxId: string, filePath: string): Promise<void> {
    try {
      await this.client.delete(
        `/api/sandboxes/${sandboxId}/files/${encodeURIComponent(filePath)}`
      );
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    sandboxId: string,
    dirPath: string = '/'
  ): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/api/sandboxes/${sandboxId}/files`,
        {
          params: { path: dirPath },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * Initialize git in sandbox
   */
  async initGit(
    sandboxId: string,
    repoUrl: string,
    options?: {
      branch?: string;
      sshKey?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/api/sandboxes/${sandboxId}/git/init`,
        {
          repoUrl,
          branch: options?.branch || 'main',
          sshKey: options?.sshKey,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get git status
   */
  async getGitStatus(sandboxId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/sandboxes/${sandboxId}/git/status`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status;
      const message =
        axiosError.response?.data?.error || axiosError.message;

      console.error(`Daytona API Error [${status}]:`, message);

      throw new Error(`Daytona API Error: ${message}`);
    }

    throw error;
  }
}

// Export singleton instance
let daytonaInstance: DaytonaClient;

export function getDaytonaClient(): DaytonaClient {
  if (!daytonaInstance) {
    daytonaInstance = new DaytonaClient();
  }
  return daytonaInstance;
}

export default DaytonaClient;
