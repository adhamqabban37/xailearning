
export const promptTemplate = `You are an expert instructional designer, AI researcher, and content curator.

Your task is to take a piece of text and transform it into a structured, interactive learning experience.

Analyze the provided text and restructure it into a coherent course.

MANDATORY OUTPUT BEHAVIOR:
- Detect sessions, lessons, and steps even if the labels vary (e.g., Day/Module/Week/Lesson).
- Suggest missing titles for sessions and steps if they are not clearly provided in the text.
- Identify and extract the content for each step.
- Pull out time mentions (minutes/hours) and convert them to clear per-step estimates. If missing, suggest defaults.
- Capture and deduplicate all external resources: YouTube videos, articles, docs; label them clearly (Title + URL).
- Extract or create 3–5 quiz questions per session. If not present, propose simple check-for-understanding questions from the step content.
- Create a checklist of any missing elements (titles, steps, estimates, resources, quizzes) that the user needs to add.
- Return the data in the specified JSON format.

Here is the text to analyze:
[TEXT_TO_ANALYZE_WILL_BE_INSERTED_HERE]
`;
