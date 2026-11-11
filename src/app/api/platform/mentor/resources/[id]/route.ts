import { apiMentor } from "@/lib/platform/guards";
import { audit, getResource, updateResource } from "@/lib/platform/store";
import type { ResourceType } from "@/lib/platform/types";

/**
 * One resource.
 *
 * `PATCH` changes it. Only a mentor who owns the program it belongs to
 * can change it.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const mentor = await apiMentor();
  if (!mentor) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const existing = await getResource(id);
  if (!existing) {
    return Response.json({ error: "No such resource" }, { status: 404 });
  }
  if (!mentor.programIds.includes(existing.programId)) {
    return Response.json(
      { error: "That resource is not one of yours" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    maxScore?: string | number;
    deadline?: string;
    tags?: string;
  };

  const type: ResourceType =
    body.type === "quiz" || body.type === "project" ? body.type : existing.type;

  const resource = await updateResource(id, {
    title: body.title,
    description: body.description,
    type,
    url: body.url,
    maxScore:
      body.maxScore === undefined ? undefined : Number(body.maxScore) || 0,
    deadline:
      body.deadline === undefined
        ? undefined
        : body.deadline
          ? new Date(body.deadline).toISOString()
          : null,
    tags: body.tags
      ? body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined,
  });

  await audit({
    actorId: mentor.id,
    actorRole: mentor.role,
    action: "resource.updated",
    subject: id,
    detail: resource?.title ?? "",
  });

  return Response.json({ resource });
}
