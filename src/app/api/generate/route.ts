import { NextRequest, NextResponse } from 'next/server';

interface GenerationParams {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  model: string
  seed: string
  steps: number
  guidanceScale: number
  safetyChecker: boolean
  enhance: boolean
  nologo: boolean
  private: boolean
}

export async function POST(request: NextRequest) {
  try {
    const params: GenerationParams = await request.json();

    if (!params.prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build the Pollinations image URL
    let prompt = params.prompt;
    
    // Add negative prompt if provided
    if (params.negativePrompt?.trim()) {
      prompt += `, negative prompt: ${params.negativePrompt}`;
    }

    // Build the URL with parameters
    const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    const urlParams = new URLSearchParams();

    // Add model parameter
    if (params.model && params.model !== 'flux') {
      urlParams.append('model', params.model);
    }

    // Add dimensions
    urlParams.append('width', params.width.toString());
    urlParams.append('height', params.height.toString());

    // Add seed if provided
    if (params.seed) {
      urlParams.append('seed', params.seed);
    }

    // Add quality parameters
    if (params.steps) {
      urlParams.append('steps', params.steps.toString());
    }

    if (params.guidanceScale) {
      urlParams.append('guidance_scale', params.guidanceScale.toString());
    }

    // Add boolean flags
    if (params.nologo) {
      urlParams.append('nologo', 'true');
    }

    if (params.private) {
      urlParams.append('private', 'true');
    }

    if (params.enhance) {
      urlParams.append('enhance', 'true');
    }

    if (!params.safetyChecker) {
      urlParams.append('safety_checker', 'false');
    }

    const finalUrl = `${baseUrl}?${urlParams.toString()}`;

    console.log('Generating image with URL:', finalUrl);

    // Make request to Pollinations
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Pollinations-AI-Generator/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API error:', response.status, errorText);
      throw new Error(`Pollinations API error: ${response.status} - ${errorText}`);
    }

    // Get the image as blob
    const imageBlob = await response.blob();
    
    // Convert to base64 for JSON response
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageBlob.type || 'image/png';

    // Create data URL
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      prompt: params.prompt,
      params: params,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle GET requests for compatibility
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const params: GenerationParams = {
    prompt: searchParams.get('prompt') || '',
    negativePrompt: searchParams.get('negativePrompt') || '',
    width: parseInt(searchParams.get('width') || '512'),
    height: parseInt(searchParams.get('height') || '512'),
    model: searchParams.get('model') || 'flux',
    seed: searchParams.get('seed') || '',
    steps: parseInt(searchParams.get('steps') || '20'),
    guidanceScale: parseFloat(searchParams.get('guidanceScale') || '7.5'),
    safetyChecker: searchParams.get('safetyChecker') !== 'false',
    enhance: searchParams.get('enhance') === 'true',
    nologo: searchParams.get('nologo') === 'true',
    private: searchParams.get('private') === 'true'
  };

  return await POST({ json: async () => params } as NextRequest);
}