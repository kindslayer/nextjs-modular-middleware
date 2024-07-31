# Next.js Middleware Package

A customizable middleware solution for Next.js 14, allowing you to define and chain multiple middlewares based on request patterns.

## Installation

Install the package via npm:

```bash
npm install nextjs-multiple-middleware
or 
pnpm add nextjs-multiple-middleware
```
## Usage
This package provides a flexible way to manage and execute middleware functions in a Next.js application. Follow the steps below to integrate and use the middleware.

## Setting Up the Middleware
1. Import Middleware Functions: First, ensure that you have middleware functions defined. Middleware functions are asynchronous functions that take a NextRequest object and optionally return a NextResponse object.

```javascript
import { NextRequest, NextResponse } from "next/server";

export async function yourMiddleware(req: NextRequest): Promise<NextResponse | void> {
// 	your middleware logic
}
```
2. Configure Middleware Registry: Use the BossMiddleware class to manage and execute your middleware functions. Import the BossMiddleware from the npm package.
   there are two types of middleware functions. ones that have exclusive path and the ones the don't. the Exclusive path middlewares are only working on the exact path and not on other path

```javascript
// your path to middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { BossMiddleware } from "nextjs-multiple-middleware";
import { yourGlobalMiddleware } from "./yourMiddleware";
import { otherMiddleware } from "./yourMiddleware";

export default async function middleware(req: NextRequest, res: NextResponse): Promise<NextResponse> {
	const registry = new BossMiddleware(req, [yourGlobalMiddleware]);

	
	// global middleware is running on all of your global path that you defined
	registry.add('your global path', [yourGlobalMiddleware]); 
	
	// Add other middleware as needed
    // exclusive middlewares has exclusive flag set to true and only run on the selected path
	registry.add('/auth*', [Auth], {exclusive:true});

	return registry.execute();
}

```

### Multiple Middlewares

if you want to have **multiple chained middlewares** on different path, simple call registry.add
```javascript
	registry.add('/path1*', [Auth], {exclusive:true});
    registry.add('/path2*', [Cookie]);
    registry.add('/path3*', [...otherMiddlewares])
	...
```

if you want to have **multiple chained middlewares** on a certain path, you can import multiple middlewares and put it in its array.
```javascript
	registry.add('/path*', [Auth, Cookie, ...otherMiddlewares], {exclusive:true});
    or
    registry.add('/path*', [Auth, Cookie, ...otherMiddlewares]);
```

if you want to have both of the combination
```javascript
	registry.add('/path1*', [Auth, Cookie, ...otherMiddlewares], {exclusive:true or false --> default false});
    registry.add('/path2*', [Auth, Cookie, ...otherMiddlewares]);
    registry.add('/path3*', [Auth, Cookie, ...otherMiddlewares]);
	...
```