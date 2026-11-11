import { apiMentor } from "@/lib/platform/guards";
import { audit, createResource } from "@/lib/platform/store";
import type { ResourceType } from "@/lib/platform/types";

/**
 * Publishing a resource.
 *
 * The three kinds of work are a video, a quiz and a project. A resource
 * carries the most it can be worth and the date it is due, and every
 * mentee on the program starts with it assigned.
 */
export async function POST(request: Request) {
  const mentor = await apiMentor();
  if (!mentor) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    programId?: string;
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    maxScore?: string | number;
    deadline?: string;
    tags?: string;
  };

  if (!body.programId) {
    return Response.json({ error: "Choose a program" }, { status: 400 });
  }
  if (!mentor.programIds.includes(body.programId)) {
    return Response.json(
      { error: "That program is not one of yours" },
      { status: 403 },
    );
  }
  if (!body.title?.trim()) {
    return Response.json({ error: "Give the resource a title" }, { status: 400 });
  }

  const type: ResourceType =
    body.type === "quiz" || body.type === "project" ? body.type : "video";

  const maxScore = Number(body.maxScore ?? 0);
  if (!Number.isFinite(maxScore) || maxScore < 0) {
    return Response.json(
      { error: "The maximum score has to be a number" },
      { status: 400 },
    );
  }

  const resource = await createResource({
    programId: body.programId,
    title: body.title,
    description: body.description,
    type,
    url: body.url,
    maxScore,
    deadline: body.deadline ? new Date(body.deadline).toISOString() : null,
    tags: body.tags
      ? body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    createdBy: mentor.id,
  });

  await audit({
    actorId: mentor.id,
    actorRole: mentor.role,
    action: "resource.published",
    subject: resource.id,
    detail: resource.title,
  });

  return Response.json({ resource }, { status: 201 });
}
