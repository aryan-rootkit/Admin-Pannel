import connectDB from './mongodb';
import Holiday, { IHoliday } from '@/models/Holiday';
import type { HolidayApiParams, HolidayDTO } from '@/types/holiday';

const CALENDARIFIC_BASE_URL = 'https://calendarific.com/api/v2/holidays';

function mapCalendarificToDTO(item: any, country: string, year: number): HolidayDTO {
  const dateStr = item?.date?.iso;
  const primaryType = Array.isArray(item?.type) && item.type.length > 0 ? item.type[0] : 'public';

  return {
    name: item?.name || 'Holiday',
    description: item?.description || '',
    date: dateStr,
    country,
    type: primaryType,
  };
}

export async function fetchAndStoreHolidays(params: HolidayApiParams): Promise<IHoliday[]> {
  const { country, year } = params;

  if (!process.env.CALENDARIFIC_API_KEY) {
    throw new Error('CALENDARIFIC_API_KEY is not configured in .env.local');
  }

  await connectDB();

  const url = new URL(CALENDARIFIC_BASE_URL);
  url.searchParams.set('api_key', process.env.CALENDARIFIC_API_KEY);
  url.searchParams.set('country', country);
  url.searchParams.set('year', String(year));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendarific request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const holidaysRaw = json?.response?.holidays || [];

  const dtos: HolidayDTO[] = holidaysRaw.map((h: any) =>
    mapCalendarificToDTO(h, country, year)
  );

  const bulkOps = dtos.map((h) => ({
    updateOne: {
      filter: {
        country: h.country,
        year,
        date: new Date(h.date),
        name: h.name,
      },
      update: {
        $set: {
          description: h.description || '',
          type: h.type,
          iso: h.date,
          year,
          raw: undefined,
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await Holiday.bulkWrite(bulkOps, { ordered: false });
  }

  const stored = await Holiday.find({ country, year }).sort({ date: 1 }).lean<IHoliday[]>();
  return stored;
}

