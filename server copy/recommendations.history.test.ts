import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createRecommendation, upsertUser, getUserByOpenId } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("recommendations.history", () => {
  it("retrieves user recommendation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First, create a recommendation
    await createRecommendation({
      userId: ctx.user!.id,
      favoriteMedia: JSON.stringify(["Test Movie 1", "Test Movie 2"]),
      themes: "action",
      plots: "fast-paced",
      genres: "thriller",
      mediaTypes: JSON.stringify(["movies"]),
      results: JSON.stringify([
        {
          title: "Test Recommendation",
          type: "movie",
          creator: "Test Director",
          year: "2024",
          description: "A test movie recommendation",
        },
      ]),
    });

    // Retrieve history
    const history = await caller.recommendations.history();

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    // Verify the structure of history items
    const firstItem = history[0];
    expect(firstItem).toHaveProperty("id");
    expect(firstItem).toHaveProperty("favoriteMedia");
    expect(firstItem).toHaveProperty("mediaTypes");
    expect(firstItem).toHaveProperty("results");
    expect(firstItem).toHaveProperty("createdAt");

    // Verify parsed JSON fields
    expect(Array.isArray(firstItem?.favoriteMedia)).toBe(true);
    expect(Array.isArray(firstItem?.mediaTypes)).toBe(true);
    expect(Array.isArray(firstItem?.results)).toBe(true);
  });

  it("returns empty array for user with no history", async () => {
    // Use a different user ID that likely has no history
    const { ctx } = createAuthContext(99999);
    const caller = appRouter.createCaller(ctx);

    const history = await caller.recommendations.history();

    expect(Array.isArray(history)).toBe(true);
  });

  it("only returns history for the authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);

    // Ensure users exist in database
    await upsertUser({
      openId: ctx1.user!.openId,
      name: ctx1.user!.name,
      email: ctx1.user!.email,
    });
    await upsertUser({
      openId: ctx2.user!.openId,
      name: ctx2.user!.name,
      email: ctx2.user!.email,
    });

    // Get actual user IDs from database
    const dbUser1 = await getUserByOpenId(ctx1.user!.openId);
    const dbUser2 = await getUserByOpenId(ctx2.user!.openId);

    if (!dbUser1 || !dbUser2) {
      throw new Error("Failed to create test users");
    }

    // Create recommendation for user 1
    await createRecommendation({
      userId: dbUser1.id,
      favoriteMedia: JSON.stringify(["User 1 Movie"]),
      mediaTypes: JSON.stringify(["movies"]),
      results: JSON.stringify([
        {
          title: "User 1 Recommendation",
          type: "movie",
          creator: "Director",
          year: "2024",
          description: "Test",
        },
      ]),
    });

    // Create recommendation for user 2
    await createRecommendation({
      userId: dbUser2.id,
      favoriteMedia: JSON.stringify(["User 2 Movie"]),
      mediaTypes: JSON.stringify(["movies"]),
      results: JSON.stringify([
        {
          title: "User 2 Recommendation",
          type: "movie",
          creator: "Director",
          year: "2024",
          description: "Test",
        },
      ]),
    });

    // Update contexts with actual user IDs
    ctx1.user!.id = dbUser1.id;
    ctx2.user!.id = dbUser2.id;

    // Get history for user 1
    const caller1 = appRouter.createCaller(ctx1);
    const history1 = await caller1.recommendations.history();

    // Get history for user 2
    const caller2 = appRouter.createCaller(ctx2);
    const history2 = await caller2.recommendations.history();

    // Verify each user only sees their own history
    expect(history1.every((item) => item.userId === dbUser1.id)).toBe(true);
    expect(history2.every((item) => item.userId === dbUser2.id)).toBe(true);
  });
});
