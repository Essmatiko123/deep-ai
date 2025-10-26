import { NextRequest, NextResponse } from 'next/server';

// Generic API proxy for custom endpoints and local models
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method = 'POST', headers = {}, params, data } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Build URL with parameters
    const url = new URL(endpoint);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare request headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Prepare request body
    let requestBody: string | undefined;
    if (data && method !== 'GET') {
      requestBody = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      return NextResponse.json(jsonData);
    } else if (contentType?.includes('image/')) {
      // Handle image responses
      const imageBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = contentType;
      
      return NextResponse.json({
        imageUrl: `data:${mimeType};base64,${base64}`,
        mimeType,
        size: imageBuffer.byteLength
      });
    } else {
      // Handle text responses
      const textData = await response.text();
      return NextResponse.json({ 
        response: textData,
        contentType
      });
    }

  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { error: `Proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method') || 'GET';
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Build URL with all search parameters except 'endpoint' and 'method'
    const url = new URL(endpoint);
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint' && key !== 'method') {
        url.searchParams.append(key, value);
      }
    });

    // Make the request
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      return NextResponse.json(jsonData);
    } else if (contentType?.includes('image/')) {
      // Handle image responses
      const imageBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = contentType;
      
      return NextResponse.json({
        imageUrl: `data:${mimeType};base64,${base64}`,
        mimeType,
        size: imageBuffer.byteLength
      });
    } else {
      // Handle text responses
      const textData = await response.text();
      return NextResponse.json({ 
        response: textData,
        contentType
      });
    }

  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { error: `Proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}