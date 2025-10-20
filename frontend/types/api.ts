// TypeScript interfaces matching backend SQLModel definitions

export interface Course {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  level?: string;
  duration: string;
  milestones?: string[];
  final_competency?: string;
  source_filename: string;
  structured: boolean;
  timeline?: Record<string, any>;
  library?: Record<string, any>;
  // Additional fields from API response
  course_id?: string;
  description?: string;
  modules_count?: number;
  modules?: Module[];
  lessons?: Lesson[];
  total_lessons?: number;
  total_hours?: number;
  estimated_weeks?: number;
  difficulty?: string;
  key_skills?: string[];
}

export interface Lesson {
  lesson_number: number;
  title: string;
  topics: string[];
  duration: string;
  content: string;
  resources?: string[];
  skill_tags?: string[];
  daily_plan?: Record<string, any>;
  practice_exercises?: Array<{
    exercise_number: number;
    title: string;
    description: string;
    difficulty: string;
    estimated_time: string;
  }>;
  learning_objectives?: string[];
  key_takeaways?: string[];
}

export interface LearningGuide {
  study_plan?: {
    total_duration?: string;
    recommended_pace?: string;
    daily_commitment?: string;
    milestones?: Array<{
      week: number;
      goal: string;
      skills: string[];
    }>;
  };
  learning_path?: Array<{
    lesson_number?: number;
    title?: string;
    duration?: string;
    difficulty?: string;
    prerequisites?: string[];
    outcomes?: string[];
  }>;
  resource_library?: {
    all_videos?: string[];
    practice_exercises?: Array<{
      lesson: string;
      exercises: Array<{
        title: string;
        description: string;
        difficulty: string;
        estimated_time: string;
      }>;
    }>;
    skill_matrix?: {
      skills: string[];
      progression: string;
    };
  };
}

export interface UploadResponse {
  course_id: string; // Guaranteed course ID from backend
  course: Course;
  learning_guide: LearningGuide;
  processing_info: {
    filename: string;
    file_size: number;
    text_length: number;
    lessons_parsed: number;
    lessons_enriched: number;
    course_saved: boolean;
    pipeline_steps_completed: string[];
  };
}

export interface Module {
  id: string;
  course_id: string;
  index: number;
  title: string;
  start_date?: string;
  end_date?: string;
  objectives: string[];
  summary_notes: string[];
  pitfalls?: string[];
  resources: Record<string, any>;
  daily_plan: Record<string, any>;
  quiz: Record<string, any>;
  assignment?: Record<string, any>;
}

export interface Progress {
  id: string;
  course_id: string;
  module_id?: string;
  user_id: string;
  day_key?: string;
  minutes_spent: number;
  actions_completed: string[];
  quiz_score?: number;
  notes?: string;
  module_completed: boolean;
  last_accessed: string;
  created_at: string;
}
