import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./resolvers";
import { createContext, type GraphQLContext } from "./context";
import { getEnv } from "../../infrastructure/config/env";

export async function createServer(): Promise<{
  server: ApolloServer<GraphQLContext>;
  url: string;
}> {
  const env = getEnv();

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: env.NODE_ENV !== "production",
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: env.PORT },
    context: async ({ req }) => createContext({ req }),
  });

  return { server, url };
}
