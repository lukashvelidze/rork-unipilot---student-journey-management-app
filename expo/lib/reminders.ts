import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { JourneyWithProgress } from "@/lib/journeyProgress";
import { getUniversityLevelDetails, upcomingDeadline } from "@/lib/journeyRoutes";
import type { UserTaskRecord } from "@/lib/tasks";

/**
 * Local deadline reminders: application deadlines of the universities a
 * student follows and the due dates of their own tasks. Everything is
 * scheduled on-device, so it works without a push server.
 */

const ENABLED_KEY = "reminders-enabled";
// iOS keeps at most 64 pending local notifications per app.
const MAX_SCHEDULED = 60;
const REMIND_HOUR = 9;
const DEADLINE_LEAD_DAYS = [30, 7, 1];
const TASK_LEAD_DAYS = [1, 0];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const getRemindersEnabled = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== "false";
  } catch {
    return true;
  }
};

/** Turn reminders on (asking for permission) or off. Resolves to the new state. */
export const setRemindersEnabled = async (enabled: boolean): Promise<boolean> => {
  if (enabled && !(await ensurePermission(true))) {
    await AsyncStorage.setItem(ENABLED_KEY, "false").catch(() => null);
    return false;
  }
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "true" : "false").catch(() => null);
  if (!enabled) await Notifications.cancelAllScheduledNotificationsAsync().catch(() => null);
  return enabled;
};

const ensurePermission = async (prompt: boolean): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  if (!prompt || !current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

const atRemindHour = (isoDate: string, daysBefore: number) => {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day - daysBefore, REMIND_HOUR, 0, 0);
};

const leadText = (days: number) => (days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`);

type Reminder = { date: Date; title: string; body: string; data: Record<string, string> };

/**
 * Re-schedule every reminder from the student's current journeys and tasks.
 * Safe to call often; it only asks for permission the first time it's enabled.
 */
export const syncDeadlineReminders = async (
  journeys: JourneyWithProgress[],
  customTasks: UserTaskRecord[],
): Promise<void> => {
  try {
    if (Platform.OS === "web" || !(await getRemindersEnabled())) return;

    const now = Date.now();
    const reminders: Reminder[] = [];

    for (const journey of journeys) {
      const university = journey.journey?.university;
      if (!university) continue;
      const hasOpenTasks = journey.progress.some((stage) => stage.tasks.some((task) => !task.completed));
      if (!hasOpenTasks) continue;
      const deadline = upcomingDeadline(
        getUniversityLevelDetails(university, journey.journey?.education_level)?.applicationDeadline,
      );
      if (!deadline) continue;
      for (const days of DEADLINE_LEAD_DAYS) {
        reminders.push({
          date: atRemindHour(deadline, days),
          title: `${university.name} deadline ${leadText(days)}`,
          body:
            days > 1
              ? "Check your application tasks so nothing is left for the last minute."
              : "Make sure your application is submitted.",
          data: { url: "/(tabs)/journey" },
        });
      }
    }

    for (const task of customTasks) {
      if (task.is_completed || !task.due_date) continue;
      for (const days of TASK_LEAD_DAYS) {
        reminders.push({
          date: atRemindHour(task.due_date, days),
          title: days === 0 ? "Due today" : "Due tomorrow",
          body: task.title,
          data: { url: "/(tabs)/journey" },
        });
      }
    }

    const upcoming = reminders
      .filter((reminder) => reminder.date.getTime() > now + 60_000)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, MAX_SCHEDULED);

    // Ask for permission in context: only once there is something to remind about.
    if (upcoming.length === 0 || !(await ensurePermission(true))) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const reminder of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, data: reminder.data },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date },
      });
    }
  } catch (error) {
    console.warn("Could not schedule reminders:", error);
  }
};
