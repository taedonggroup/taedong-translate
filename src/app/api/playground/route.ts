import { NextRequest, NextResponse } from 'next/server';
import { translate } from '@/lib/translate';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text?: string; targets?: string[] };
    const { text, targets } = body;

    if (!text || !targets || !Array.isArray(targets)) {
      return NextResponse.json(
        { error: 'text and targets required' },
        { status: 400 },
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: '텍스트는 5000자 이하여야 합니다' },
        { status: 400 },
      );
    }

    const results = [];
    for (const to of targets) {
      try {
        const result = await translate(text, 'ko', to);
        results.push({ ...result, toLang: to, success: true });
      } catch (error) {
        results.push({
          translated: '',
          provider: 'error',
          durationMs: 0,
          inputChars: text.length,
          outputChars: 0,
          cost: 0,
          toLang: to,
          success: false,
          error: String(error),
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[/api/playground]', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}
