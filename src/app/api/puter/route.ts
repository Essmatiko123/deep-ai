import { NextRequest, NextResponse } from 'next/server';

// Puter.js API integration for file storage and operations
const PUTER_API_BASE = 'https://api.puter.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, authToken } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'upload':
        return await handleUpload(data, authToken);
      case 'download':
        return await handleDownload(data, authToken);
      case 'list':
        return await handleList(data, authToken);
      case 'delete':
        return await handleDelete(data, authToken);
      case 'createFolder':
        return await handleCreateFolder(data, authToken);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Puter API error:', error);
    return NextResponse.json(
      { error: 'Failed to process Puter request' },
      { status: 500 }
    );
  }
}

async function handleUpload(data: any, authToken?: string) {
  const { fileData, fileName, path } = data;
  
  if (!fileData || !fileName) {
    return NextResponse.json({ error: 'File data and name are required' }, { status: 400 });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([Buffer.from(fileData, 'base64')], { type: 'application/octet-stream' });
    formData.append('file', blob, fileName);
    if (path) {
      formData.append('path', path);
    }

    const response = await fetch(`${PUTER_API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

async function handleDownload(data: any, authToken?: string) {
  const { fileId, path } = data;
  
  if (!fileId && !path) {
    return NextResponse.json({ error: 'File ID or path is required' }, { status: 400 });
  }

  try {
    const url = fileId ? `${PUTER_API_BASE}/files/${fileId}` : `${PUTER_API_BASE}/download`;
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    
    const response = await fetch(`${url}${params}`, {
      method: 'GET',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return NextResponse.json({
      fileData: base64,
      mimeType: blob.type,
      fileName: path || fileId
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

async function handleList(data: any, authToken?: string) {
  const { path } = data;
  
  try {
    const url = path ? `${PUTER_API_BASE}/list?path=${encodeURIComponent(path)}` : `${PUTER_API_BASE}/list`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`List failed: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

async function handleDelete(data: any, authToken?: string) {
  const { fileId, path } = data;
  
  if (!fileId && !path) {
    return NextResponse.json({ error: 'File ID or path is required' }, { status: 400 });
  }

  try {
    const url = fileId ? `${PUTER_API_BASE}/files/${fileId}` : `${PUTER_API_BASE}/delete`;
    const body = path ? { path } : {};
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'application/json',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

async function handleCreateFolder(data: any, authToken?: string) {
  const { path, name } = data;
  
  if (!path || !name) {
    return NextResponse.json({ error: 'Path and name are required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${PUTER_API_BASE}/folders`, {
      method: 'POST',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, name }),
    });

    if (!response.ok) {
      throw new Error(`Create folder failed: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// Get Puter auth URL for user authentication
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'auth-url') {
    const redirectUri = searchParams.get('redirect_uri') || `${process.env.NEXT_PUBLIC_APP_URL}/auth/puter/callback`;
    const authUrl = `https://puter.com/auth?redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=${process.env.PUTER_CLIENT_ID}`;
    
    return NextResponse.json({ authUrl });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}