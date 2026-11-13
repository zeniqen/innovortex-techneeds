import * as sqlite from "./backends/sqlite";
import * as tn from "./backends/tn";
import type { PlatformStore } from "./store-types";

/**
 * Where the platform data lives.
 *
 * By default it is in the backend that came with the platform, running on
 * this machine at http://localhost:8000, which is what the brief asks
 * for. Set `PLATFORM_BACKEND=sqlite` to keep it in this project's own
 * database instead, which needs no MongoDB and nothing else set up.
 *
 * The panels do not know which one they are talking to.
 */
const backend: PlatformStore =
  process.env.PLATFORM_BACKEND === "sqlite" ? sqlite : tn;

/**
 * True when the platform data is being held by the tn backend rather than
 * by this project's own database.
 */
export const usesTnBackend = backend === tn;

export const listPrograms = backend.listPrograms;
export const getProgram = backend.getProgram;
export const createProgram = backend.createProgram;
export const updateProgram = backend.updateProgram;
export const deleteProgram = backend.deleteProgram;

export const listMentors = backend.listMentors;
export const getMentor = backend.getMentor;
export const createMentor = backend.createMentor;
export const assignMentorToProgram = backend.assignMentorToProgram;
export const removeMentorFromProgram = backend.removeMentorFromProgram;
export const listMentorsForProgram = backend.listMentorsForProgram;
export const deleteMentor = backend.deleteMentor;

export const listMentees = backend.listMentees;
export const getMentee = backend.getMentee;
export const listMenteesForProgram = backend.listMenteesForProgram;
export const createMentee = backend.createMentee;
export const assignMenteeToProgram = backend.assignMenteeToProgram;
export const removeMenteeFromProgram = backend.removeMenteeFromProgram;

export const listResources = backend.listResources;
export const getResource = backend.getResource;
export const createResource = backend.createResource;
export const updateResource = backend.updateResource;
export const deleteResource = backend.deleteResource;

export const getProgress = backend.getProgress;
export const listMenteeResources = backend.listMenteeResources;
export const listMentorResourceProgress = backend.listMentorResourceProgress;
export const getSubmission = backend.getSubmission;
export const startResource = backend.startResource;
export const submitResource = backend.submitResource;
export const gradeResource = backend.gradeResource;

export const scoreEventsFor = backend.scoreEventsFor;
export const leaderboard = backend.leaderboard;

export const programCount = backend.programCount;
export const resetPlatform = backend.resetPlatform;
export const counts = backend.counts;
