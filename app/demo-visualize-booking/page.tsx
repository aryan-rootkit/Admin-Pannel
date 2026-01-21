'use client';

import InteractiveCalendar from '@/components/ui/visualize-booking';

export default function InteractiveCalendarDemo() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-black px-4 py-10 md:justify-center">
      <InteractiveCalendar />
    </main>
  );
}
