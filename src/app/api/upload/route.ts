import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  const { userId } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!filename || !request.body) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  try {
    // Generate a unique path to avoid collisions
    const blobPrefix = `users/${userId}/photos`;
    const uniqueFilename = `${blobPrefix}/${Date.now()}-${filename}`;

    const blob = await put(uniqueFilename, request.body, {
      access: 'public',
      // Optionally restrict max file size, though request limit also applies
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Erreur Vercel Blob Upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
