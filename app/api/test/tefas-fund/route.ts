import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const symbol = searchParams.get('symbol') || 'YKT';
        
        // TEFAS fon fiyatını çek
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/prices/latest?symbol=${symbol}&type=FUND`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('TEFAS fund test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}