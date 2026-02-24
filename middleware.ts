import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (isLoginPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (req.nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
