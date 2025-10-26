import { NextRequest, NextResponse } from 'next/server';
import { getChatMemory } from '@/lib/memory';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action');

    const chatMemory = getChatMemory(sessionId || undefined);

    if (action === 'clear') {
      await chatMemory.clearMemory();
      return NextResponse.json({ 
        success: true, 
        message: 'Memory cleared successfully',
        sessionId: chatMemory.getSessionId()
      });
    }

    // Get memory
    const memory = await chatMemory.getFullMemory();
    
    return NextResponse.json({ 
      memory,
      sessionId: chatMemory.getSessionId(),
      messageCount: memory.length
    });

  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process memory request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message } = body;

    const chatMemory = getChatMemory(sessionId || undefined);

    if (action === 'save' && message) {
      await chatMemory.saveMessage(message.role, message.content);
      return NextResponse.json({ 
        success: true, 
        message: 'Message saved to memory',
        sessionId: chatMemory.getSessionId()
      });
    }

    if (action === 'clear') {
      await chatMemory.clearMemory();
      return NextResponse.json({ 
        success: true, 
        message: 'Memory cleared successfully',
        sessionId: chatMemory.getSessionId()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process memory request' },
      { status: 500 }
    );
  }
}