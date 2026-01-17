import { prisma } from '../../db/client';

export async function getUserProfile(userId: string): Promise<string | null> {
    const profile = await prisma.userProfile.findUnique({
        where: { userId },
    });
    return profile?.summary || null;
}

export async function upsertUserProfile(userId: string, summary: string): Promise<void> {
    await prisma.userProfile.upsert({
        where: { userId },
        update: { summary },
        create: { userId, summary },
    });
}
