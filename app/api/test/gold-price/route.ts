import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Altın fiyatını çek
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/prices/latest?symbol=GOLD&type=COMMODITY`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Gold price test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}