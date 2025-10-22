import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const allQuestions = await prisma.question.findMany({
      take: 20,
      orderBy: { id: "asc" },
    });

    const pairs = allQuestions.map((q) => ({
      id: q.id,
      originalUrl: q.imageUrl,
      generatedUrl: q.imageUrl.replace("original", "ai"), // simple mock pattern
    }));

    return Response.json({ pairs });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
