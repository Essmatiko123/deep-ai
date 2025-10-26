import { db } from '@/lib/db';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatMemory {
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    try {
      await db.chatMemory.create({
        data: {
          sessionId: this.sessionId,
          role,
          content,
        },
      });
    } catch (error) {
      console.error('Failed to save message to memory:', error);
    }
  }

  async getMemory(limit: number = 10): Promise<ChatMessage[]> {
    try {
      const memories = await db.chatMemory.findMany({
        where: { sessionId: this.sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return memories.map(memory => ({
        role: memory.role as 'user' | 'assistant',
        content: memory.content,
      }));
    } catch (error) {
      console.error('Failed to retrieve memory:', error);
      return [];
    }
  }

  async getFullMemory(): Promise<ChatMessage[]> {
    try {
      const memories = await db.chatMemory.findMany({
        where: { sessionId: this.sessionId },
        orderBy: { createdAt: 'asc' },
      });

      return memories.map(memory => ({
        role: memory.role as 'user' | 'assistant',
        content: memory.content,
      }));
    } catch (error) {
      console.error('Failed to retrieve full memory:', error);
      return [];
    }
  }

  async clearMemory(): Promise<void> {
    try {
      await db.chatMemory.deleteMany({
        where: { sessionId: this.sessionId },
      });
    } catch (error) {
      console.error('Failed to clear memory:', error);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  formatMemoryForPrompt(memory: ChatMessage[]): string {
    if (memory.length === 0) return '';

    const memoryText = memory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    return `[Previous Conversation Context]\n${memoryText}\n[End of Context]\n\n`;
  }
}

// Singleton instance for the current session
let currentMemory: ChatMemory | null = null;

export function getChatMemory(sessionId?: string): ChatMemory {
  if (!currentMemory || (sessionId && currentMemory.getSessionId() !== sessionId)) {
    currentMemory = new ChatMemory(sessionId);
  }
  return currentMemory;
}