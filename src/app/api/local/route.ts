import { NextRequest, NextResponse } from 'next/server';

// Local model integration with MCP support
interface LocalModelConfig {
  id: string;
  name: string;
  endpoint: string;
  type: 'text' | 'image';
  apiKey?: string;
  headers?: Record<string, string>;
  format?: 'openai' | 'ollama' | 'custom';
}

// MCP (Model Context Protocol) standard endpoints
const MCP_ENDPOINTS = {
  ollama: 'http://localhost:11434',
  lmstudio: 'http://localhost:1234',
  textgen: 'http://localhost:5000',
  stableDiffusion: 'http://localhost:7860',
  custom: ''
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, modelConfig, prompt, options } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate':
        return await handleGenerate(modelConfig, prompt, options);
      case 'listModels':
        return await handleListModels(modelConfig);
      case 'testConnection':
        return await handleTestConnection(modelConfig);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Local model API error:', error);
    return NextResponse.json(
      { error: `Local model request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleGenerate(modelConfig: LocalModelConfig, prompt: string, options: any = {}) {
  if (!modelConfig || !prompt) {
    return NextResponse.json({ error: 'Model config and prompt are required' }, { status: 400 });
  }

  try {
    const { endpoint, type, format = 'ollama', headers = {} } = modelConfig;
    
    if (type === 'text') {
      return await generateText(endpoint, prompt, format, headers, options);
    } else if (type === 'image') {
      return await generateImage(endpoint, prompt, format, headers, options);
    } else {
      return NextResponse.json({ error: 'Invalid model type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

async function generateText(endpoint: string, prompt: string, format: string, headers: Record<string, string>, options: any) {
  let requestBody: any;
  let apiEndpoint = endpoint;

  switch (format) {
    case 'openai':
      // OpenAI-compatible format
      requestBody = {
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        ...options
      };
      apiEndpoint = `${endpoint}/v1/chat/completions`;
      break;
      
    case 'ollama':
      // Ollama format
      requestBody = {
        model: options.model || 'llama2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 1000,
          ...options
        }
      };
      apiEndpoint = `${endpoint}/api/generate`;
      break;
      
    case 'custom':
      // Custom format - pass through
      requestBody = {
        prompt: prompt,
        ...options
      };
      break;
      
    default:
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  }

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Generation failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  let responseText = '';

  // Extract response based on format
  switch (format) {
    case 'openai':
      responseText = data.choices?.[0]?.message?.content || data.response || '';
      break;
    case 'ollama':
      responseText = data.response || data.text || '';
      break;
    case 'custom':
      responseText = data.response || data.text || data.content || JSON.stringify(data);
      break;
  }

  return NextResponse.json({
    response: responseText,
    model: options.model || 'unknown',
    format: format,
    usage: data.usage || {},
    timestamp: new Date().toISOString()
  });
}

async function generateImage(endpoint: string, prompt: string, format: string, headers: Record<string, string>, options: any) {
  let requestBody: any;
  let apiEndpoint = endpoint;

  switch (format) {
    case 'openai':
      // OpenAI DALL-E compatible format
      requestBody = {
        model: options.model || 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        ...options
      };
      apiEndpoint = `${endpoint}/v1/images/generations`;
      break;
      
    case 'ollama':
      // Ollama image generation (if supported)
      requestBody = {
        model: options.model || 'stablediffusion',
        prompt: prompt,
        options: {
          width: options.width || 1024,
          height: options.height || 1024,
          ...options
        }
      };
      apiEndpoint = `${endpoint}/api/generate`;
      break;
      
    case 'custom':
      // Custom format - for Stable Diffusion WebUI, etc.
      requestBody = {
        prompt: prompt,
        width: options.width || 1024,
        height: options.height || 1024,
        steps: options.steps || 20,
        cfg_scale: options.cfg_scale || 7,
        ...options
      };
      apiEndpoint = `${endpoint}/sdapi/v1/txt2img`;
      break;
      
    default:
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
  }

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  let imageUrl = '';

  // Extract image based on format
  switch (format) {
    case 'openai':
      imageUrl = data.data?.[0]?.url || '';
      break;
    case 'ollama':
      // Ollama might return base64 or URL
      imageUrl = data.image_url || data.image || '';
      break;
    case 'custom':
      // Stable Diffusion WebUI returns base64
      if (data.images && data.images.length > 0) {
        const base64Image = data.images[0];
        imageUrl = `data:image/png;base64,${base64Image}`;
      }
      break;
  }

  return NextResponse.json({
    imageUrl: imageUrl,
    prompt: prompt,
    model: options.model || 'unknown',
    format: format,
    timestamp: new Date().toISOString()
  });
}

async function handleListModels(modelConfig: LocalModelConfig) {
  if (!modelConfig) {
    return NextResponse.json({ error: 'Model config is required' }, { status: 400 });
  }

  try {
    const { endpoint, type, format = 'ollama' } = modelConfig;
    let apiEndpoint = endpoint;

    if (format === 'ollama' && type === 'text') {
      apiEndpoint = `${endpoint}/api/tags`;
    } else if (format === 'openai') {
      apiEndpoint = `${endpoint}/v1/models`;
    } else {
      // For custom endpoints, try common patterns
      apiEndpoint = `${endpoint}/models`;
    }

    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json();
    let models = [];

    if (format === 'ollama') {
      models = data.models || [];
    } else if (format === 'openai') {
      models = data.data || [];
    } else {
      models = data.models || data;
    }

    return NextResponse.json({
      models: models,
      endpoint: endpoint,
      format: format
    });

  } catch (error) {
    console.error('List models error:', error);
    return NextResponse.json(
      { error: 'Failed to list models' },
      { status: 500 }
    );
  }
}

async function handleTestConnection(modelConfig: LocalModelConfig) {
  if (!modelConfig) {
    return NextResponse.json({ error: 'Model config is required' }, { status: 400 });
  }

  try {
    const { endpoint, type, format = 'ollama' } = modelConfig;
    let testEndpoint = endpoint;

    if (format === 'ollama') {
      testEndpoint = `${endpoint}/api/tags`;
    } else if (format === 'openai') {
      testEndpoint = `${endpoint}/v1/models`;
    } else {
      testEndpoint = endpoint;
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const isConnected = response.ok;
    let details = '';

    if (isConnected) {
      details = `Connected successfully to ${format} ${type} model at ${endpoint}`;
    } else {
      details = `Connection failed: ${response.status} ${response.statusText}`;
    }

    return NextResponse.json({
      connected: isConnected,
      details: details,
      endpoint: endpoint,
      format: format,
      type: type
    });

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      connected: false,
      details: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      endpoint: modelConfig.endpoint
    });
  }
}

// Get available MCP endpoints
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'endpoints') {
    return NextResponse.json({
      endpoints: MCP_ENDPOINTS,
      formats: ['openai', 'ollama', 'custom'],
      types: ['text', 'image']
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}