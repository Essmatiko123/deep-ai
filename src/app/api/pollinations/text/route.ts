import { NextRequest, NextResponse } from 'next/server';
import { getChatMemory } from '@/lib/memory';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt');
  const model = searchParams.get('model') || 'openai';
  const seed = searchParams.get('seed');
  const temperature = searchParams.get('temperature');
  const maxTokens = searchParams.get('max_tokens');

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    // Pollinations text API endpoint
    const apiUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (model && model !== 'OpenAI' && model !== 'openai') {
      params.append('model', model.toLowerCase());
    }
    if (seed) {
      params.append('seed', seed);
    }
    if (temperature) {
      params.append('temperature', temperature);
    }
    if (maxTokens) {
      params.append('max_tokens', maxTokens);
    }

    const url = params.toString() ? `${apiUrl}?${params.toString()}` : apiUrl;

    console.log('Text generation URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AI-Chat-Studio/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API error:', response.status, errorText);
      throw new Error(`Pollinations API error: ${response.status} - ${errorText}`);
    }

    const data = await response.text();
    
    return NextResponse.json({ 
      response: data,
      model: model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate text' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, seed, temperature, maxTokens, files, sessionId, selectedApi, selectedApiConfig, customApis, localModels } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get chat memory instance
    const chatMemory = getChatMemory(sessionId);
    
    // Save user message to memory
    await chatMemory.saveMessage('user', prompt);

    // Get recent memory for context
    const memory = await chatMemory.getMemory(10); // Get last 10 messages for context
    const memoryContext = chatMemory.formatMemoryForPrompt(memory);

    // Build enhanced prompt with memory context
    let enhancedPrompt = prompt;
    if (memoryContext) {
      enhancedPrompt = `${memoryContext}Current user message: ${prompt}

Please respond to the current message while being aware of the previous conversation context. If the user references something from earlier in the conversation, acknowledge it and continue naturally. Maintain consistency with previous responses.`;
    }

    // Process file attachments if present
    if (files && files.length > 0) {
      console.log('Processing request with files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      
      const textFiles = files.filter(file => 
        file.type.startsWith('text/') || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.json') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.xml') ||
        file.name.endsWith('.csv')
      );

      if (textFiles.length > 0) {
        const fileContents = textFiles.map(file => {
          return `\n--- File: ${file.name} (${file.type}) ---\n${file.content}\n--- End of ${file.name} ---`;
        }).join('\n\n');

        enhancedPrompt = `${enhancedPrompt}\n\n[Attached Files Content]\n${fileContents}\n[End of Files]\n\nPlease consider the content of these attached files when responding to the user's message.`;
      }
    }

    // Add structured response instruction for better formatting
    if (selectedApi !== 'pollinations') {
      enhancedPrompt += `\n\nPlease format your response with proper structure:
- Use code blocks with language specification (e.g., \`\`\`javascript, \`\`\`python)
- Use numbered or bulleted lists for clarity
- Use proper headings and formatting
- Include JSON data in formatted code blocks
- Make code snippets copyable and well-formatted`;
    }

    let response;
    let responseData;

    // Handle different API endpoints
    if (selectedApi === 'openai') {
      // OpenAI API integration with user-provided API key
      const openaiUrl = 'https://api.openai.com/v1/chat/completions';
      const apiKey = selectedApiConfig?.apiKey || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 400 });
      }
      
      response = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: enhancedPrompt }],
          temperature: temperature ? parseFloat(temperature) : 0.7,
          max_tokens: maxTokens ? parseInt(maxTokens) : 1000,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        responseData = data.choices[0]?.message?.content || 'No response from OpenAI';
      }
    } else if (selectedApi === 'mistral') {
      // Mistral API integration with user-provided API key
      const mistralUrl = 'https://api.mistral.ai/v1/chat/completions';
      const apiKey = selectedApiConfig?.apiKey;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'Mistral API key is required' }, { status: 400 });
      }
      
      // Map common model names to Mistral models
      let mistralModel = model || 'mistral-tiny';
      if (model === 'gpt-3.5-turbo' || model === 'gpt-4' || model === 'OpenAI') {
        mistralModel = 'mistral-tiny';
      } else if (model === 'claude-3-sonnet' || model === 'claude-3-haiku') {
        mistralModel = 'mistral-small';
      }
      
      response = await fetch(mistralUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: mistralModel,
          messages: [{ role: 'user', content: enhancedPrompt }],
          temperature: temperature ? parseFloat(temperature) : 0.7,
          max_tokens: maxTokens ? parseInt(maxTokens) : 1000,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        responseData = data.choices[0]?.message?.content || 'No response from Mistral';
      }
    } else if (selectedApi === 'claude') {
      // Claude API integration with user-provided API key
      const claudeUrl = 'https://api.anthropic.com/v1/messages';
      const apiKey = selectedApiConfig?.apiKey;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'Claude API key is required' }, { status: 400 });
      }
      
      // Map common model names to Claude models
      let claudeModel = model || 'claude-3-haiku-20240307';
      if (model === 'gpt-3.5-turbo' || model === 'gpt-4' || model === 'OpenAI') {
        claudeModel = 'claude-3-haiku-20240307';
      } else if (model === 'mistral-tiny' || model === 'mistral-small') {
        claudeModel = 'claude-3-sonnet-20240229';
      }
      
      response = await fetch(claudeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: maxTokens ? parseInt(maxTokens) : 1000,
          messages: [{ role: 'user', content: enhancedPrompt }],
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        responseData = data.content?.[0]?.text || 'No response from Claude';
      }
    } else if (selectedApi === 'pollinations' || !selectedApi) {
      // Default to Pollinations
      const apiUrl = `https://text.pollinations.ai/${encodeURIComponent(enhancedPrompt)}`;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (model && model !== 'OpenAI' && model !== 'openai') {
        params.append('model', model.toLowerCase());
      }
      if (seed) {
        params.append('seed', seed);
      }
      if (temperature) {
        params.append('temperature', temperature);
      }
      if (maxTokens) {
        params.append('max_tokens', maxTokens);
      }

      const url = params.toString() ? `${apiUrl}?${params.toString()}` : apiUrl;

      console.log('Text generation URL with memory:', url);

      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'AI-Chat-Studio/1.0',
        },
      });

      if (response.ok) {
        responseData = await response.text();
      }
    } else {
      // Check if it's a custom API from settings
      try {
        const allApis = [
          ...(customApis || []),
          ...(localModels || [])
        ];
        
        const apiConfig = allApis.find(api => api.id === selectedApi) || selectedApiConfig;
        
        if (apiConfig && apiConfig.endpoint) {
          console.log('Using custom API endpoint:', apiConfig.endpoint);
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          // Add API key if provided
          if (apiConfig.apiKey) {
            headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
          }
          
          // Determine request format based on API type
          const isMessagesFormat = apiConfig.endpoint.includes('openai.com') || 
                                 apiConfig.endpoint.includes('anthropic.com') ||
                                 apiConfig.endpoint.includes('mistral.ai') ||
                                 apiConfig.endpoint.includes('/chat/completions') ||
                                 apiConfig.endpoint.includes('/v1/messages');
          
          const requestBody: any = {
            model: model || 'default',
            temperature: temperature ? parseFloat(temperature) : 0.7,
            max_tokens: maxTokens ? parseInt(maxTokens) : 1000,
          };
          
          if (isMessagesFormat) {
            requestBody.messages = [{ role: 'user', content: enhancedPrompt }];
          } else {
            requestBody.prompt = enhancedPrompt;
          }
          
          response = await fetch(apiConfig.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = await response.json();
            responseData = data.choices?.[0]?.message?.content || data.content || data.response || JSON.stringify(data);
          }
        } else {
          // Fallback to Pollinations if API not found
          console.log('API not found, falling back to Pollinations');
          const apiUrl = `https://text.pollinations.ai/${encodeURIComponent(enhancedPrompt)}`;
          response = await fetch(apiUrl);
          if (response.ok) {
            responseData = await response.text();
          }
        }
      } catch (error) {
        console.error('Error with custom API, falling back to Pollinations:', error);
        // Fallback to Pollinations
        const apiUrl = `https://text.pollinations.ai/${encodeURIComponent(enhancedPrompt)}`;
        response = await fetch(apiUrl);
        if (response.ok) {
          responseData = await response.text();
        }
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error('API error:', response?.status, errorText);
      throw new Error(`API error: ${response?.status || 'Network'} - ${errorText}`);
    }

    // Save assistant response to memory
    await chatMemory.saveMessage('assistant', responseData);
    
    return NextResponse.json({ 
      response: responseData,
      model: model,
      timestamp: new Date().toISOString(),
      filesProcessed: files ? files.length : 0,
      sessionId: chatMemory.getSessionId(),
      memoryContext: memory.length > 0,
      selectedApi: selectedApi
    });

  } catch (error) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate text' },
      { status: 500 }
    );
  }
}