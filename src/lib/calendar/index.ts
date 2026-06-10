// Calendar - Calendar management

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  color?: string;
}

export class CalendarManager {
  private events: Map<string, CalendarEvent> = new Map();

  createEvent(event: Omit<CalendarEvent, 'id'>): { id: string; status: string } {
    const id = crypto.randomUUID();

    this.events.set(id, {
      id,
      ...event,
    });

    return { id, status: 'created' };
  }

  listEvents(startDate?: Date, endDate?: Date): CalendarEvent[] {
    let result = Array.from(this.events.values());

    if (startDate) {
      result = result.filter((e) => e.start >= startDate);
    }

    if (endDate) {
      result = result.filter((e) => e.end <= endDate);
    }

    return result;
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): { status: string } {
    const event = this.events.get(id);
    if (!event) {
      return { status: 'not-found' };
    }

    this.events.set(id, { ...event, ...updates });

    return { status: 'updated' };
  }

  deleteEvent(id: string): { status: string } {
    this.events.delete(id);

    return { status: 'deleted' };
  }

  getEvent(id: string): CalendarEvent | null {
    return this.events.get(id) || null;
  }
}

export const calendarManager = new CalendarManager();
