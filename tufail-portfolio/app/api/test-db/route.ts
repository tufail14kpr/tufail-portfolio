import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ 
      success: true, 
      message: '✅ MongoDB Connected Successfully!',
      uri: process.env.MONGODB_URI?.replace(/:([^:@]{1,})@/, ':****@') // Hide password
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: '❌ MongoDB Connection Failed',
      error: String(error)
    }, { status: 500 });
  }
}
