import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Seed providers
    const deepl = await prisma.provider.upsert({
      where: { name: 'deepl' },
      update: {},
      create: {
        name: 'deepl',
        displayName: 'DeepL Free',
        active: true,
        isDefault: true,
      },
    });

    await prisma.provider.upsert({
      where: { name: 'claude' },
      update: {},
      create: {
        name: 'claude',
        displayName: 'Claude Haiku 4.5',
        active: false,
        isDefault: false,
      },
    });

    // Seed sites
    const vitamin = await prisma.site.upsert({
      where: { apiKey: 'td_tr_vitamin_demo' },
      update: {},
      create: {
        name: '비타민의원',
        domain: 'vitamin-clinic-taedong.vercel.app',
        apiKey: 'td_tr_vitamin_demo',
        active: true,
      },
    });

    const seolin = await prisma.site.upsert({
      where: { apiKey: 'td_tr_seolin_demo' },
      update: {},
      create: {
        name: '서린실업',
        domain: 'seolin-website.vercel.app',
        apiKey: 'td_tr_seolin_demo',
        active: true,
      },
    });

    // Seed some translation logs
    const now = new Date();
    const logsToCreate = [];

    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);

      logsToCreate.push({
        siteId: Math.random() > 0.5 ? vitamin.id : seolin.id,
        providerId: deepl.id,
        fromLang: 'ko',
        toLang: ['en', 'ja', 'zh'][Math.floor(Math.random() * 3)],
        inputChars: Math.floor(Math.random() * 500) + 50,
        outputChars: Math.floor(Math.random() * 500) + 50,
        durationMs: Math.floor(Math.random() * 400) + 200,
        cost: 0,
        success: true,
        createdAt: date,
      });
    }

    await prisma.translationLog.createMany({ data: logsToCreate });

    return NextResponse.json({ ok: true, message: '시드 데이터가 생성되었습니다.' });
  } catch (error) {
    console.error('[/api/seed]', error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
