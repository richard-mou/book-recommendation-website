import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("recommendations.generate", () => {
  it("generates recommendations based on user preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      favoriteMedia: ["The Matrix", "Inception", "Interstellar"],
      themes: "science fiction, mind-bending",
      plots: "complex narratives",
      genres: "sci-fi, thriller",
      mediaTypes: ["movies" as const],
    };

    const result = await caller.recommendations.generate(input);

    // Verify the result structure
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Verify each recommendation has required fields
    result.forEach((rec) => {
      expect(rec).toHaveProperty("title");
      expect(rec).toHaveProperty("type");
      expect(rec).toHaveProperty("creator");
      expect(rec).toHaveProperty("year");
      expect(rec).toHaveProperty("description");
      expect(typeof rec.title).toBe("string");
      expect(typeof rec.creator).toBe("string");
      expect(typeof rec.description).toBe("string");
      expect(["book", "movie", "song", "tv_show"]).toContain(rec.type);
    });
  }, 30000); // 30 second timeout for LLM call

  it("handles all media types request", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      favoriteMedia: ["Harry Potter", "The Beatles"],
      mediaTypes: ["all" as const],
    };

    const result = await caller.recommendations.generate(input);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it("requires at least one favorite media item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      favoriteMedia: [],
      mediaTypes: ["books" as const],
    };

    await expect(caller.recommendations.generate(input)).rejects.toThrow();
  });
});
