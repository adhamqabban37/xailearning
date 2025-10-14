import appRoute from "@genkit-ai/next";
import { auditCourseFlow } from "@/ai/flows/audit-course";

export const POST = appRoute(auditCourseFlow);
