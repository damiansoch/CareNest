import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except internal Next.js paths and static files
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
