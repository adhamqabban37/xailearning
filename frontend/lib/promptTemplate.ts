export const UNIVERSAL_PROMPT = `🚀 AI LEARNING ROADMAP GENERATOR

You are an expert instructional designer and AI content curator.  
Generate a complete, timeline-based learning roadmap for the following:

TOPIC: [ENTER YOUR TOPIC HERE]

LEARNER PROFILE:
- Level: [Beginner / Intermediate / Advanced]
- Time Commitment: [X hours per week for Y weeks]
- Learning Style: [Visual / Auditory / Kinesthetic / Mixed]
- Goal: [Clear, measurable outcome]

MANDATORY OUTPUT BEHAVIOR:
- Always include real, working URLs.
- Prefer high-quality, authoritative sources and recent content (2021+).
- Produce structured JSON blocks for resources, daily plans, and quizzes.
- Summarize PDFs and long articles in bullet points.
- Provide YouTube links with titles, durations, and key timestamps if available.
- Keep all lists specific and actionable (no placeholders once topic is set).

STRUCTURE AND CONTENT REQUIREMENTS:

1️⃣ Overview
- 2–3 sentence summary of the roadmap
- Duration and key milestones
- Final competency description

2️⃣ Module Breakdown (5–7 modules total)
For each module, provide:
- Title, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
- 3–5 measurable learning objectives
- Resource pack (YouTube, courses/tutorials, PDFs/docs, websites) in JSON
- Daily action plan (automation-ready tasks) in JSON
- Quiz (MCQ, short answer, practical) in JSON
- Mini-project or assignment with rubric

3️⃣ Resource Pack (JSON)
{
 "resources": {
   "youtube": [...],
   "courses": [...],
   "pdfs_docs": [...],
   "websites": [...],
   "practice_platforms": [...]
 }
}

4️⃣ Daily Action Plan (JSON)
{
 "daily_plan": {
   "day_1": [...],
   "day_2": [...]
 }
}

5️⃣ Quiz & Assessment (JSON)
{
 "quiz": {...},
 "assignment": {...}
}

6️⃣ Timeline (JSON)
{
 "timeline": {
   "start_date": "[YYYY-MM-DD]",
   "end_date": "[YYYY-MM-DD]",
   "milestones": [...]
 }
}

7️⃣ Notes & Summaries
- Bullet summary (≤10 bullets) per module
- Key terms glossary with short definitions
- Common pitfalls + self-check prompts

8️⃣ Quality Rules
- Use real URLs only, prioritize recency and authority
- Keep 3–5 curated videos per module
- Keep total time within learner's stated commitment

🧭 If TOPIC is empty or unclear, propose 3 clear topic options (narrow, focused, broad) with a one-sentence description each, and wait for my confirmation before generating the full roadmap.`;

export const PROMPT_INSTRUCTIONS = `## How to Use This Enhanced Prompt

1. **Copy the prompt above** (the entire text with 🚀 AI LEARNING ROADMAP GENERATOR)
2. **Fill in the TOPIC field** with your specific learning goal
3. **Complete the LEARNER PROFILE section** with your details:
   - Level: Choose Beginner, Intermediate, or Advanced
   - Time Commitment: e.g., "5 hours per week for 8 weeks"
   - Learning Style: Visual, Auditory, Kinesthetic, or Mixed
   - Goal: What you want to achieve (e.g., "Build a portfolio website", "Get certified in AWS")
4. **Paste into ChatGPT, Claude, or Gemini**
5. **Wait for the AI to generate your structured roadmap**
6. **Save the complete response as a PDF**
7. **Upload the PDF to our platform**

## Why This Prompt Works Better

✅ **Structured JSON Output**: Organized data that our platform can parse better
✅ **Real URLs & Resources**: No placeholder links, all working resources
✅ **Timeline-Based**: Clear start/end dates and milestones
✅ **Quality Control**: Emphasis on recent, authoritative sources
✅ **Personalized**: Adapts to your level and learning style
✅ **Actionable**: Daily tasks that are automation-ready

The AI will create a comprehensive roadmap with modules, timelines, resources, quizzes, and projects that our platform converts into an interactive learning experience!`;
