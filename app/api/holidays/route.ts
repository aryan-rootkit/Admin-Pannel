import { NextRequest, NextResponse } from 'next/server';
import { fetchAndStoreHolidays } from '@/lib/holidays';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get('country') || 'IN').toUpperCase();
    const yearParam = searchParams.get('year');
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    if (!year || Number.isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    const holidays = await fetchAndStoreHolidays({ country, year });

    return NextResponse.json(
      {
        country,
        year,
        count: holidays.length,
        holidays: holidays.map((h) => ({
          id: h._id.toString(),
          name: h.name,
          description: h.description,
          date: h.date,
          country: h.country,
          type: h.type,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.message?.includes('CALENDARIFIC_API_KEY')) {
      return NextResponse.json(
        { error: 'Calendarific API key is not configured on the server.' },
        { status: 500 }
      );
    }

    if (error?.message?.includes('Calendarific request failed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }

    console.error('Error in /api/holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays.' },
      { status: 500 }
    );
  }
}

