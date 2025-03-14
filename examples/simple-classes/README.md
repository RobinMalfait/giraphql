# A Simple GiraphQL API using data described by typescript classes

This example shows how to create a GraphQL API that exposes data defined by classes

This example uses the following packages:

- `@giraphql/core`: For building the schema
- `apollo-server`: For creating a server that executes the schema

## Schema

```graphql
type Comment {
  author: User
  comment: String!
  id: ID!
  post: Post!
}

type Post {
  author: User
  comments: [Comment!]!
  content: String!
  id: ID!
  title: String!
}

type Query {
  post(id: ID!): Post
  posts(skip: Int, take: Int): [Post!]
  user(id: ID!): User
}

type User {
  comments: [Comment!]!
  firstName: String!
  fullName: String!
  id: ID!
  lastName: String!
  posts: [Post!]!
}
```
