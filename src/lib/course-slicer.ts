import type { Lesson, StoredCourse, StudySession } from './types';

const DEFAULT_LESSON_TIME = 5; // 5 minutes

export function sliceSession(
  storedCourse: StoredCourse,
  durationMinutes: number
): StudySession | null {

  const { course, progress } = storedCourse;
  
  const allLessons = course.sessions.flatMap(s => s.lessons);
  const uncompletedLessons = allLessons.filter(lesson => !progress[lesson.id]);

  if (uncompletedLessons.length === 0) {
    return null; // Course is complete
  }
  
  const firstUncompletedLesson = uncompletedLessons[0];
  const sessionIndex = course.sessions.findIndex(s => s.lessons.some(lesson => lesson.id === firstUncompletedLesson.id));
  const currentSessionInfo = course.sessions[sessionIndex];

  let cumulativeTime = 0;
  const sessionLessons: Lesson[] = [];

  for (const lesson of uncompletedLessons) {
    const lessonOriginalSessionIndex = course.sessions.findIndex(s => s.lessons.some(l => l.id === lesson.id));
    if (lessonOriginalSessionIndex < sessionIndex) continue;

    const lessonTime = lesson.timeEstimateMinutes || DEFAULT_LESSON_TIME;
    
    if (sessionLessons.length === 0) {
        sessionLessons.push(lesson);
        cumulativeTime += lessonTime;
        continue;
    }

    if (cumulativeTime + lessonTime <= durationMinutes) {
      cumulativeTime += lessonTime;
      sessionLessons.push(lesson);
    } else {
      break; 
    }
  }
  
  return {
    title: currentSessionInfo.session_title,
    lessons: sessionLessons,
    sessionIndex: sessionIndex,
    durationMinutes: durationMinutes,
    totalStepsInCourse: allLessons.length,
    completedStepsInCourse: Object.keys(progress).length,
  };
}
