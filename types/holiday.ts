export interface HolidayDTO {
  name: string;
  description?: string;
  date: string;
  country: string;
  type: string;
}

export interface HolidayApiParams {
  country: string;
  year: number;
}

