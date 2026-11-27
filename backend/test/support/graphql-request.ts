import { INestApplication } from "@nestjs/common";
import request from "supertest";

export interface GraphQLBody {
  data?: Record<string, unknown> | null;
  errors?: {
    message: string;
    extensions: { code: string; reason?: string; fieldErrors?: unknown };
  }[];
}

export interface GraphQLResult {
  body: GraphQLBody;
  /** The raw `Set-Cookie` headers of the response. */
  setCookies: string[];
}

/**
 * Sends one GraphQL operation. `cookies` are `name=value` pairs, as a browser would send back;
 * `headers` are extra request headers, such as `X-Forwarded-For`.
 */
export async function graphqlRequest(
  app: INestApplication,
  query: string,
  {
    cookies = [],
    headers = {},
    variables,
  }: {
    cookies?: string[];
    headers?: Record<string, string>;
    variables?: Record<string, unknown>;
  } = {},
): Promise<GraphQLResult> {
  const response = await request(app.getHttpServer())
    .post("/graphql")
    .set("Cookie", cookies.join("; "))
    .set(headers)
    .send({ query, variables })
    .expect(200);

  const setCookie: unknown = response.headers["set-cookie"];
  return {
    body: response.body as GraphQLBody,
    setCookies: Array.isArray(setCookie) ? (setCookie as string[]) : [],
  };
}

/** `name=value` of a `Set-Cookie` header, ready to send back. */
export function toCookiePair(setCookie: string): string {
  return setCookie.split(";")[0] ?? "";
}

export function findSetCookie(setCookies: string[], name: string): string | undefined {
  return setCookies.find((cookie) => cookie.startsWith(`${name}=`));
}
