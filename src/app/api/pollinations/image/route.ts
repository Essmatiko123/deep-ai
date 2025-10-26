import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt');
  const model = searchParams.get('model') || 'flux';
  const seed = searchParams.get('seed');
  const width = searchParams.get('width') || '1024';
  const height = searchParams.get('height') || '1024';

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    // Pollinations image API endpoint
    const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (model && model !== 'OpenAI') {
      params.append('model', model.toLowerCase());
    }
    if (seed) {
      params.append('seed', seed);
    }
    params.append('width', width);
    params.append('height', height);
    params.append('nologo', 'true'); // Remove watermark

    const url = `${apiUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status}`);
    }

    // Get the image as blob
    const imageBlob = await response.blob();
    
    // Convert to base64 for JSON response
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageBlob.type || 'image/png';

    return NextResponse.json({ 
      imageUrl: `data:${mimeType};base64,${base64}`,
      model: model,
      timestamp: new Date().toISOString(),
      prompt: prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, seed, width, height, referenceImage, selectedApi, selectedApiConfig, customApis, localModels } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Log file information for debugging
    if (referenceImage) {
      console.log('Processing image generation with reference image');
    }

    let response;
    let responseData;

    // Handle different API endpoints for image generation
    if (selectedApi === 'openai') {
      // OpenAI DALL-E integration with user-provided API key
      const openaiUrl = 'https://api.openai.com/v1/images/generations';
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
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        responseData = data.data?.[0]?.url;
        if (responseData) {
          // Convert the image URL to base64
          const imageResponse = await fetch(responseData);
          const imageBlob = await imageResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = imageBlob.type || 'image/png';
          responseData = `data:${mimeType};base64,${base64}`;
        }
      }
    } else if (selectedApi === 'pollinations' || !selectedApi) {
      // Default to Pollinations
      const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (model && model !== 'OpenAI') {
        params.append('model', model.toLowerCase());
      }
      if (seed) {
        params.append('seed', seed);
      }
      params.append('width', width || '1024');
      params.append('height', height || '1024');
      params.append('nologo', 'true'); // Remove watermark

      const url = `${apiUrl}?${params.toString()}`;

      console.log('Image generation URL:', url);

      response = await fetch(url, {
        method: 'GET',
      });

      if (response.ok) {
        const imageBlob = await response.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageBlob.type || 'image/png';
        responseData = `data:${mimeType};base64,${base64}`;
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
          console.log('Using custom API endpoint for image generation:', apiConfig.endpoint);
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          // Add API key if provided
          if (apiConfig.apiKey) {
            headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
          }
          
          response = await fetch(apiConfig.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              prompt: prompt,
              model: model || 'default',
              width: width || 1024,
              height: height || 1024,
              seed: seed,
              reference_image: referenceImage,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            responseData = data.imageUrl || data.image_url || data.url || data.images?.[0]?.url;
            
            // If we get a URL back, convert it to base64
            if (responseData && responseData.startsWith('http')) {
              const imageResponse = await fetch(responseData);
              const imageBlob = await imageResponse.blob();
              const arrayBuffer = await imageBlob.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const mimeType = imageBlob.type || 'image/png';
              responseData = `data:${mimeType};base64,${base64}`;
            }
          }
        } else {
          // Fallback to Pollinations if API not found
          console.log('API not found, falling back to Pollinations');
          const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
          response = await fetch(apiUrl);
          if (response.ok) {
            const imageBlob = await response.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = imageBlob.type || 'image/png';
            responseData = `data:${mimeType};base64,${base64}`;
          }
        }
      } catch (error) {
        console.error('Error with custom API, falling back to Pollinations:', error);
        // Fallback to Pollinations
        const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
        response = await fetch(apiUrl);
        if (response.ok) {
          const imageBlob = await response.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = imageBlob.type || 'image/png';
          responseData = `data:${mimeType};base64,${base64}`;
        }
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error('Image API error:', response?.status, errorText);
      throw new Error(`Image API error: ${response?.status || 'Network'} - ${errorText}`);
    }

    return NextResponse.json({ 
      imageUrl: responseData,
      model: model,
      timestamp: new Date().toISOString(),
      prompt: prompt,
      hasReferenceImage: !!referenceImage,
      selectedApi: selectedApi
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}