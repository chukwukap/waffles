/**
 * Calendar Link Generator
 *
 * Generates links for adding events to various calendar providers.
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

/**
 * Generates a Google Calendar URL
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
    details: event.description,
    location: event.location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an ICS file content for Apple Calendar, Outlook, etc.
 */
export function generateICS(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return (
      date
        .toISOString()
        .replace(/-|:|\.\d{3}/g, "")
        .slice(0, 15) + "Z"
    );
  };

  const uid = `waffles-${Date.now()}@wafflesgame.com`;
  const now = formatDate(new Date());

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Waffles//Game//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatDate(event.startTime)}
DTEND:${formatDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, "\\n")}
LOCATION:${event.location || "Waffles Game"}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Downloads an ICS file (for Apple Calendar, Outlook)
 */
export function downloadICS(event: CalendarEvent): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `waffles-game.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates Outlook Web URL
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => date.toISOString();

  const params = new URLSearchParams({
    rru: "addevent",
    subject: event.title,
    body: event.description,
    startdt: formatDate(event.startTime),
    enddt: formatDate(event.endTime),
    location: event.location || "",
    path: "/calendar/action/compose",
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Creates a calendar event for a Waffles game
 */
export function createGameCalendarEvent(
  theme: string,
  prizePool: number,
  startsAt: Date,
  endsAt: Date,
  gameUrl: string
): CalendarEvent {
  return {
    title: `🧇 Waffles: ${theme}`,
    description: `Play Waffles and win from the $${prizePool.toLocaleString()} prize pool!\n\n${gameUrl}`,
    startTime: startsAt,
    endTime: endsAt,
    location: gameUrl,
  };
}
