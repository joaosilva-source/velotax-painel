import { NextResponse } from 'next/server';
export async function middleware() {
  // Temporariamente desativado para evitar loops de redirect durante configuração do OAuth
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
