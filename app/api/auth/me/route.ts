import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      profile: user.profile
        ? {
            skillTags: JSON.parse(user.profile.skillTags || '[]'),
            workYears: user.profile.workYears,
          }
        : null,
    },
  });
}
