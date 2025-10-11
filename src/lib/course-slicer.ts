import type { Step, StoredCourse, StudySession } from './types';

const DEFAULT_STEP_TIME = 5; // 5 minutes

export function sliceSession(
  storedCourse: StoredCourse,
  durationMinutes: number
): StudySession | null {

  const { course, progress } = storedCourse;
  
  const totalStepsInCourse = course.sessions.reduce((acc, session) => acc + session.steps.length, 0);
  const completedStepsInCourse = Object.keys(progress).length;

  // Find the first session with at least one uncompleted step
  for (let i = 0; i < course.sessions.length; i++) {
    const session = course.sessions[i];
    const uncompletedSteps = session.steps.filter(step => progress[step.id] !== 'completed');

    if (uncompletedSteps.length > 0) {
      // We found a session to start. Now slice it.
      let cumulativeTime = 0;
      const sessionSteps: Step[] = [];

      for (const step of uncompletedSteps) {
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
        title: session.title,
        steps: sessionSteps,
        sessionIndex: i,
        totalStepsInCourse,
        completedStepsInCourse: completedStepsInCourse
      };
    }
  }

  // All sessions completed
  return null;
}
