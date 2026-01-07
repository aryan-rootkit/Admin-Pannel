'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Calendar, momentLocalizer, View, Event as CalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/en-gb';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Calendar Page
 * Interactive calendar with drag & drop, edit, and delete functionality
 */

// Set moment locale
moment.locale('en-gb');

const localizer = momentLocalizer(moment);

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start: z.string().min(1, 'Start date is required'),
  end: z.string().min(1, 'End date is required'),
  type: z.enum(['event', 'task', 'deadline']),
  color: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  _id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'event' | 'task' | 'deadline';
  color?: string;
  project?: string;
  assignedTo?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'event',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      const url = selectedEvent ? `/api/events/${selectedEvent._id}` : '/api/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          start: new Date(data.start),
          end: new Date(data.end),
        }),
      });

      if (res.ok) {
        await fetchEvents();
        setIsModalOpen(false);
        reset();
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const e = event as any;
    setSelectedEvent(e);
    setValue('title', e.title);
    setValue('description', e.description || '');
    setValue('start', moment(e.start).format('YYYY-MM-DDTHH:mm'));
    setValue('end', moment(e.end).format('YYYY-MM-DDTHH:mm'));
    setValue('type', e.type);
    setValue('color', e.color || '#3b82f6');
    setIsModalOpen(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    reset();
    setValue('start', moment(start).format('YYYY-MM-DDTHH:mm'));
    setValue('end', moment(end).format('YYYY-MM-DDTHH:mm'));
    setIsModalOpen(true);
  };

  const handleEventDrop = async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    const e = event as any;
    try {
      await fetch(`/api/events/${e._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...e,
          start,
          end,
        }),
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent._id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchEvents();
        setIsModalOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const e = event as any;
    const color = e.color || '#3b82f6';
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
      },
    };
  };

  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    ...e,
    title: e.title,
    start: e.start,
    end: e.end,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600 text-lg">Manage events, tasks, and deadlines</p>
          </div>
          <button
            onClick={() => {
              reset();
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            onEventDrop={handleEventDrop}
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}
          />
        </div>

        {/* Event Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedEvent(null);
          }}
          title={selectedEvent ? 'Edit Event' : 'New Event'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                {...register('title')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="datetime-local"
                  {...register('start')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.start && <p className="text-red-600 text-sm mt-1">{errors.start.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input
                  type="datetime-local"
                  {...register('end')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.end && <p className="text-red-600 text-sm mt-1">{errors.end.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="event">Event</option>
                  <option value="task">Task</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  {...register('color')}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {selectedEvent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {selectedEvent ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
