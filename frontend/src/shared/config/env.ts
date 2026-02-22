export const config = {
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
  sseUrl: import.meta.env.VITE_SSE_URL || '/events',
} as const;
