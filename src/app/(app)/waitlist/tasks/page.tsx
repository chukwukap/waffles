import { TasksPageClient } from "./client";

// This page now simply renders the client component
// which handles its own authenticated data fetching
export default function TasksPage() {
    return <TasksPageClient />;
}
