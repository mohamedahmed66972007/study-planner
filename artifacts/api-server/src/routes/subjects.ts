import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { subjectsTable, lessonsTable, postponedLessonsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createLessonSchema = z.object({
  name: z.string().min(1),
  allocatedMinutes: z.number().nullable().optional(),
});

const createSubjectSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  timeMode: z.enum(["fixed", "duration"]),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  distributeTime: z.boolean().default(false),
  lessons: z.array(createLessonSchema).default([]),
});

async function getSubjectWithLessons(id: number) {
  const subject = await db.query.subjectsTable.findFirst({
    where: eq(subjectsTable.id, id),
    with: { lessons: { orderBy: (l, { asc }) => [asc(l.order)] } },
  });
  return subject;
}

router.get("/subjects", async (req, res) => {
  const subjects = await db.query.subjectsTable.findMany({
    orderBy: [desc(subjectsTable.createdAt)],
    with: { lessons: { orderBy: (l, { asc }) => [asc(l.order)] } },
  });
  res.json(subjects);
});

router.post("/subjects", async (req, res) => {
  const body = createSubjectSchema.parse(req.body);
  const { lessons, ...subjectData } = body;

  const [subject] = await db
    .insert(subjectsTable)
    .values({
      name: subjectData.name,
      date: subjectData.date,
      timeMode: subjectData.timeMode,
      startTime: subjectData.startTime ?? null,
      endTime: subjectData.endTime ?? null,
      durationMinutes: subjectData.durationMinutes ?? null,
      description: subjectData.description ?? null,
      distributeTime: subjectData.distributeTime,
      status: "pending",
    })
    .returning();

  if (lessons.length > 0) {
    await db.insert(lessonsTable).values(
      lessons.map((l, idx) => ({
        subjectId: subject.id,
        name: l.name,
        allocatedMinutes: l.allocatedMinutes ?? null,
        completed: false,
        order: idx,
      }))
    );
  }

  const full = await getSubjectWithLessons(subject.id);
  res.status(201).json(full);
});

router.get("/subjects/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const subject = await getSubjectWithLessons(id);
  if (!subject) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(subject);
});

router.delete("/subjects/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  res.status(204).send();
});

router.post("/subjects/:id/start", async (req, res) => {
  const id = parseInt(req.params.id);
  await db
    .update(subjectsTable)
    .set({ status: "active" })
    .where(eq(subjectsTable.id, id));
  const subject = await getSubjectWithLessons(id);
  res.json(subject);
});

router.post("/subjects/:id/complete", async (req, res) => {
  const id = parseInt(req.params.id);
  const subject = await getSubjectWithLessons(id);
  if (!subject) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const incompleteLessons = (subject.lessons ?? []).filter((l) => !l.completed);
  if (incompleteLessons.length > 0) {
    await db.insert(postponedLessonsTable).values(
      incompleteLessons.map((l) => ({
        subjectName: subject.name,
        lessonName: l.name,
        originalDate: subject.date,
      }))
    );
  }

  await db
    .update(subjectsTable)
    .set({ status: "completed" })
    .where(eq(subjectsTable.id, id));

  const updated = await getSubjectWithLessons(id);
  res.json(updated);
});

router.post("/lessons/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const lesson = await db.query.lessonsTable.findFirst({
    where: eq(lessonsTable.id, id),
  });
  if (!lesson) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [updated] = await db
    .update(lessonsTable)
    .set({ completed: !lesson.completed })
    .where(eq(lessonsTable.id, id))
    .returning();
  res.json(updated);
});

router.get("/postponed", async (req, res) => {
  const items = await db.query.postponedLessonsTable.findMany({
    orderBy: [desc(postponedLessonsTable.createdAt)],
  });
  res.json(items);
});

router.delete("/postponed/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(postponedLessonsTable).where(eq(postponedLessonsTable.id, id));
  res.status(204).send();
});

export default router;
