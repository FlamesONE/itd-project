import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  CombinedGraphQLErrors,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { config } from '@shared/config';

const httpLink = createHttpLink({
  uri: config.graphqlUrl,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const err of error.errors) {
      console.error(`[GraphQL error]: Message: ${err.message}, Path: ${err.path}`);

      if (err.extensions?.code === 'UNAUTHENTICATED') {
        console.warn('Authentication error, token may be expired');
      }
    }
  } else if (error) {
    console.error(`[Network error]: ${error}`);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          feed: {
            keyArgs: false,
            merge(existing = [], incoming, { args }) {
              if (!args?.offset) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },
          trending: {
            keyArgs: ['period'],
            merge(existing = [], incoming, { args }) {
              if (!args?.offset) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },
          userPosts: {
            keyArgs: ['userId'],
            merge(existing = [], incoming, { args }) {
              if (!args?.offset) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },
          notifications: {
            keyArgs: ['unreadOnly'],
            merge(existing = [], incoming, { args }) {
              if (!args?.offset) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },
        },
      },
      Post: {
        fields: {
          engagementScore: {
            read(existing) {
              return existing ?? null;
            },
          },
          comments: {
            keyArgs: false,
            merge(existing = [], incoming, { args }) {
              if (!args?.offset) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },
        },
      },
      Comment: {
        fields: {
          replies: {
            keyArgs: ['postId', 'sortBy'],
            merge(existing = [], incoming, { args }) {
              if (!args?.offset) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
