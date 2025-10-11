import type { Step, StoredCourse, StudySession } from './types';

const DEFAULT_STEP_TIME = 5; // 5 minutes

export function sliceSession(
  storedCourse: StoredCourse,
  durationMinutes: number
): StudySession | null {

  const { course, progress } = storedCourse;
  
  const allSteps = course.sessions.flatMap(s => s.steps);
  const uncompletedSteps = allSteps.filter(step => !progress[step.id]);

  if (uncompletedSteps.length === 0) {
    return null; // Course is complete
  }
  
  // Find the session containing the first uncompleted step
  const firstUncompletedStep = uncompletedSteps[0];
  const sessionIndex = course.sessions.findIndex(s => s.steps.some(step => step.id === firstUncompletedStep.id));
  const currentSession = course.sessions[sessionIndex];

  let cumulativeTime = 0;
  const sessionSteps: Step[] = [];

  for (const step of uncompletedSteps) {
    // Only add steps from the current or subsequent sessions, but keep them grouped by their original session
    const stepOriginalSessionIndex = course.sessions.findIndex(s => s.steps.some(s_ => s_.id === step.id));
    if (stepOriginalSessionIndex < sessionIndex) continue;


    const stepTime = step.timeEstimateMinutes || DEFAULT_STEP_TIME;
    
    // If the session is empty, always add at least one step regardless of duration
    if (sessionSteps.length === 0) {
        sessionSteps.push(step);
        cumulativeTime += stepTime;
        continue;
    }

    if (cumulativeTime + stepTime <= durationMinutes) {
      cumulativeTime += stepTime;
      sessionSteps.push(step);
    } else {
      break; // Stop adding steps if the next one exceeds the duration
    }
  }
  
  return {
    title: currentSession.title,
    steps: sessionSteps,
    sessionIndex: sessionIndex,
    durationMinutes: durationMinutes,
    totalStepsInCourse: allSteps.length,
    completedStepsInCourse: Object.keys(progress).length,
  };
}
