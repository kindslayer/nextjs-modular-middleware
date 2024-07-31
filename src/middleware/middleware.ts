import {NextRequest, NextResponse} from "next/server";
import {MiddlewareRegistry} from "@/middleware/MiddlewareRegistry";

async function loggerMiddleware(req: NextRequest): Promise<NextResponse | void> {
	console.log('Url: ' + req.url);
}

export default async function middleware(req: NextRequest): Promise<NextResponse> {
	const registry = new MiddlewareRegistry(req, [loggerMiddleware]);

	registry.add('/:path*', [loggerMiddleware]);
	// registry.add('/auth*', [Auth]);


	return registry.execute();
}