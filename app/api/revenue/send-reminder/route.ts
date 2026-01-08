import { NextResponse } from 'next/server';
import { sendPaymentReminderEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client, project, amount, dueDate, invoiceNumber } = body;

    // Send email reminder
    const result = await sendPaymentReminderEmail(
      client,
      project,
      amount,
      dueDate,
      invoiceNumber
    );

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Reminder sent successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending payment reminder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
