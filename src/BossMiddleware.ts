import {NextRequest, NextResponse} from 'next/server';

export type Middleware = (req: NextRequest) => Promise<NextResponse | void>;

interface MiddlewareEntry {
	pattern: string;
	middlewares: Middleware[];
	exclusive: boolean;
	score?: number
}

export class BossMiddleware {
	private req: NextRequest;
	private middlewareEntries: MiddlewareEntry[] = [];

	constructor(req: NextRequest, globalMiddlewares: Middleware[] | undefined = undefined) {
		this.req = req;

		if (globalMiddlewares) {
			this.add("*", globalMiddlewares);
		}
	}

	protected calculateMatchPercentage(url: string, pattern: string): number {
		const regexPattern = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);

		if (!regexPattern.test(url)) {
			return 0;
		}

		const urlSegments = url.split('/');
		const patternSegments = pattern.split('/');

		let matchScore = 0;
		let maxScore = Math.max(urlSegments.length, patternSegments.length);

		for (let i = 0; i < urlSegments.length; i++) {
			if (i < patternSegments.length && (patternSegments[i] === '*' || urlSegments[i] === patternSegments[i])) {
				matchScore++;
			}
		}

		return (matchScore / maxScore) * 100;
	}

	public add(pattern: string, middlewares: Middleware[], options: { exclusive?: boolean } = {}): void {
		const entry: MiddlewareEntry = {
			pattern,
			middlewares,
			exclusive: options.exclusive ?? false,
		};

		this.middlewareEntries.push(entry);
	}

	public async execute(): Promise<NextResponse> {
		const url = this.req.nextUrl.pathname;

		let matchedEntries = this.middlewareEntries.filter(entry =>
			new RegExp(
				'^' + entry.pattern
				.replace(/:\w+/g, '[^/]+')    // Replace :path* with [^/]+ to match any segment
				.replace(/\*/g, '.*')         // Replace * with .* to match zero or more characters
				.replace(/\/\//g, '/')        // Normalize double slashes to a single slash
				.replace(/\/$/, '')
				+ '$'
			).test(url)
		);

		matchedEntries = matchedEntries.map(entry => {
			entry.score = this.calculateMatchPercentage(url, entry.pattern)
			return entry
		})

		let exclusiveEntry = matchedEntries.filter(entry => entry.exclusive)
		.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

		if (exclusiveEntry.length > 0) {
			return this.executeMiddlewares(exclusiveEntry[0].middlewares);
		} else {
			const nonexclusiveMiddlewares = matchedEntries.reduce((acc, entry) => {
				if (!entry.exclusive) {
					entry.middlewares.forEach(_middleware => {
						if (!acc.includes(_middleware)) {
							acc.push(_middleware)
						}
					})
				}
				return acc;
			}, [] as Middleware[]);

			return this.executeMiddlewares(nonexclusiveMiddlewares);
		}
	}

	private async executeMiddlewares(middlewares: Middleware[]): Promise<NextResponse> {
		for (const middleware of middlewares) {
			let res: void | NextResponse<any> = await middleware(this.req);

			if (res instanceof NextResponse) {
				return res;
			}
		}

		return NextResponse.next();
	}
}
