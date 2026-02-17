const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = 3001;

// Expanded Movie data
const trending = [
  { id: 1, title: "A", posterUrl: "https://image.tmdb.org/t/p/w500/8AQRfTuTHeFTddZN4IUAqprN8Od.jpg", description: "A thrilling adventure.", releaseDate: "2022-01-01", rating: 7.8, genres: ["Action", "Adventure"], director: "Jane Doe", cast: ["Actor 1", "Actor 2"], runtime: 120, language: "English" },
  { id: 2, title: "B", posterUrl: "https://image.tmdb.org/t/p/w500/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg", description: "A romantic comedy.", releaseDate: "2021-05-10", rating: 6.5, genres: ["Comedy", "Romance"], director: "John Smith", cast: ["Actor 3", "Actor 4"], runtime: 105, language: "English" },
  { id: 3, title: "C", posterUrl: "https://image.tmdb.org/t/p/w500/9OYu6oDLIidSOocW3JTGtd2Oyqy.jpg", description: "A sci-fi epic.", releaseDate: "2020-11-20", rating: 8.2, genres: ["Sci-Fi"], director: "Alice Lee", cast: ["Actor 5", "Actor 6"], runtime: 140, language: "English" },
  { id: 4, title: "D", posterUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", description: "A family drama.", releaseDate: "2019-07-15", rating: 7.0, genres: ["Drama"], director: "Bob Brown", cast: ["Actor 7", "Actor 8"], runtime: 110, language: "English" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", description: "A horror mystery.", releaseDate: "2018-10-31", rating: 6.9, genres: ["Horror", "Mystery"], director: "Carol White", cast: ["Actor 9", "Actor 10"], runtime: 98, language: "English" }
];
const newReleases = [
  { id: 3, title: "C", posterUrl: "https://image.tmdb.org/t/p/w500/9OYu6oDLIidSOocW3JTGtd2Oyqy.jpg", description: "A sci-fi epic.", releaseDate: "2020-11-20", rating: 8.2, genres: ["Sci-Fi"], director: "Alice Lee", cast: ["Actor 5", "Actor 6"], runtime: 140, language: "English" },
  { id: 4, title: "D", posterUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", description: "A family drama.", releaseDate: "2019-07-15", rating: 7.0, genres: ["Drama"], director: "Bob Brown", cast: ["Actor 7", "Actor 8"], runtime: 110, language: "English" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", description: "A horror mystery.", releaseDate: "2018-10-31", rating: 6.9, genres: ["Horror", "Mystery"], director: "Carol White", cast: ["Actor 9", "Actor 10"], runtime: 98, language: "English" },
  { id: 6, title: "F", posterUrl: "https://image.tmdb.org/t/p/w500/ynXoOxmDHNQ4UAy0oU6avW71HVW.jpg", description: "A fantasy adventure.", releaseDate: "2017-03-10", rating: 7.5, genres: ["Fantasy", "Adventure"], director: "David Green", cast: ["Actor 11", "Actor 12"], runtime: 130, language: "English" },
  { id: 7, title: "G", posterUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg", description: "A historical drama.", releaseDate: "2016-09-20", rating: 7.3, genres: ["Drama", "History"], director: "Eve Black", cast: ["Actor 13", "Actor 14"], runtime: 120, language: "English" }
];
const action = [
  { id: 2, title: "B", posterUrl: "https://image.tmdb.org/t/p/w500/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg", description: "A romantic comedy.", releaseDate: "2021-05-10", rating: 6.5, genres: ["Comedy", "Romance"], director: "John Smith", cast: ["Actor 3", "Actor 4"], runtime: 105, language: "English" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", description: "A horror mystery.", releaseDate: "2018-10-31", rating: 6.9, genres: ["Horror", "Mystery"], director: "Carol White", cast: ["Actor 9", "Actor 10"], runtime: 98, language: "English" },
  { id: 7, title: "G", posterUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg", description: "A historical drama.", releaseDate: "2016-09-20", rating: 7.3, genres: ["Drama", "History"], director: "Eve Black", cast: ["Actor 13", "Actor 14"], runtime: 120, language: "English" },
  { id: 8, title: "H", posterUrl: "https://image.tmdb.org/t/p/w500/6aUWe0GSl69wMTSWWexsorMIvwU.jpg", description: "A family drama.", releaseDate: "2019-07-15", rating: 7.0, genres: ["Drama"], director: "Bob Brown", cast: ["Actor 7", "Actor 8"], runtime: 110, language: "English" },
  { id: 9, title: "I", posterUrl: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", description: "A thrilling adventure.", releaseDate: "2022-01-01", rating: 7.8, genres: ["Action", "Adventure"], director: "Jane Doe", cast: ["Actor 1", "Actor 2"], runtime: 120, language: "English" }
];

// GraphQL schema
const typeDefs = gql`
  type Movie {
    id: ID!
    title: String!
    posterUrl: String
    description: String
    releaseDate: String
    rating: Float
    genres: [String]
    director: String
    cast: [String]
    runtime: Int
    language: String
  }
  type PaginatedMovies {
    results: [Movie!]!
    page: Int!
    totalPages: Int!
  }
  type HomepageRows {
    trending: [ID!]!
    newReleases: [ID!]!
    action: [ID!]!
  }
  type Query {
    homepage: HomepageRows
    moviesByIds(ids: [ID!]!): [Movie]
    trending(page: Int): PaginatedMovies
    newReleases(page: Int): PaginatedMovies
    action(page: Int): PaginatedMovies
  }
  type Mutation {
    addMovie(title: String!, posterUrl: String, list: String!): Movie
  }
`;

// Resolvers
let nextId = 10;
function paginate(array, page = 1, pageSize = 5) {
  const totalResults = array.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    results: array.slice(start, end),
    page,
    totalPages,
    totalResults,
  };
}

const resolvers = {
  Query: {
    homepage: () => ({
      trending: trending.map(m => m.id),
      newReleases: newReleases.map(m => m.id),
      action: action.map(m => m.id),
    }),
    moviesByIds: (_, { ids }) => {
      const allMovies = [...trending, ...newReleases, ...action];
      // Remove duplicates by id
      const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
      return uniqueMovies.filter(m => ids.includes(String(m.id)) || ids.includes(m.id));
    },
    trending: (_, { page = 1 }) => paginate(trending, page),
    newReleases: (_, { page = 1 }) => paginate(newReleases, page),
    action: (_, { page = 1 }) => paginate(action, page),
  },
  Mutation: {
    addMovie: (_, { title, posterUrl, list }) => {
      // Fill all required fields with defaults if not provided
      const newMovie = {
        id: nextId++,
        title,
        posterUrl: posterUrl || 'https://image.tmdb.org/t/p/w500/default.jpg',
        description: 'No description provided.',
        releaseDate: new Date().toISOString().split('T')[0],
        rating: 7.0,
        genres: ['Drama'],
        director: 'Unknown',
        cast: ['Unknown'],
        runtime: 120,
        language: 'English',
      };
      if (list === 'trending') trending.push(newMovie);
      else if (list === 'newReleases') newReleases.push(newMovie);
      else if (list === 'action') action.push(newMovie);
      return newMovie;
    },
  },
};

async function startApolloServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' }); // Explicitly set path
  app.listen(PORT, () => {
    console.log(`GraphQL server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startApolloServer();
