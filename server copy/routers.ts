import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { createRecommendation, getUserRecommendations } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  recommendations: router({
    /**
     * Generate AI-powered media recommendations
     */
    generate: protectedProcedure
      .input(
        z.object({
          favoriteMedia: z.array(z.string()).min(1, "Please add at least one favorite"),
          themes: z.string().optional(),
          plots: z.string().optional(),
          genres: z.string().optional(),
          mediaTypes: z.array(z.enum(["books", "movies", "songs", "tv_shows", "all"])).min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Build the prompt for the LLM
        const mediaTypesStr = input.mediaTypes.includes("all")
          ? "all types of media (books, movies, songs, and TV shows)"
          : input.mediaTypes.join(", ");

        const favoritesStr = input.favoriteMedia.join(", ");
        const additionalContext = [
          input.themes && `Themes: ${input.themes}`,
          input.plots && `Plot preferences: ${input.plots}`,
          input.genres && `Genres: ${input.genres}`,
        ]
          .filter(Boolean)
          .join("\n");

        const prompt = `You are a media recommendation expert. Based on the user's preferences, provide 8-10 personalized recommendations.

User's favorite media: ${favoritesStr}
${additionalContext ? `\nAdditional preferences:\n${additionalContext}` : ""}

Recommendation types: ${mediaTypesStr}

Provide recommendations in the following JSON format:
{
  "recommendations": [
    {
      "title": "Title of the media",
      "type": "book" | "movie" | "song" | "tv_show",
      "creator": "Author/Director/Artist name",
      "year": "Release year (if known)",
      "description": "2-3 sentence description explaining the plot/content and why it matches the user's preferences"
    }
  ]
}

Make sure each recommendation is relevant and includes a compelling explanation.`;

        // Call the LLM
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful media recommendation assistant. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "media_recommendations",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        type: { type: "string", enum: ["book", "movie", "song", "tv_show"] },
                        creator: { type: "string" },
                        year: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "type", "creator", "year", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("Failed to generate recommendations");
        }

        const results = JSON.parse(content);

        // Save to database
        await createRecommendation({
          userId: ctx.user.id,
          favoriteMedia: JSON.stringify(input.favoriteMedia),
          themes: input.themes || null,
          plots: input.plots || null,
          genres: input.genres || null,
          mediaTypes: JSON.stringify(input.mediaTypes),
          results: JSON.stringify(results.recommendations),
        });

        return results.recommendations;
      }),

    /**
     * Get user's recommendation history
     */
    history: protectedProcedure.query(async ({ ctx }) => {
      const history = await getUserRecommendations(ctx.user.id);
      return history.map((rec) => ({
        ...rec,
        favoriteMedia: JSON.parse(rec.favoriteMedia),
        mediaTypes: JSON.parse(rec.mediaTypes),
        results: JSON.parse(rec.results),
      }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
