import { builder } from './builder';
import { Comment, Comments, Post, Posts, User, Users } from './data';

builder.objectType(User, {
  name: 'User',
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    fullName: t.string({
      resolve: (user) => `${user.firstName} ${user.lastName}`,
    }),
    posts: t.field({
      type: [Post],
      resolve: (user) => [...Posts.values()].filter((post) => post.authorId === user.id),
    }),
    comments: t.field({
      type: [Comment],
      resolve: (user) => [...Comments.values()].filter((comment) => comment.authorId === user.id),
    }),
  }),
});

builder.objectType(Post, {
  name: 'Post',
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    author: t.field({
      type: User,
      nullable: true,
      resolve: (post) => Users.get(post.id),
    }),
    comments: t.field({
      type: [Comment],
      resolve: (user) => [...Comments.values()].filter((comment) => comment.authorId === user.id),
    }),
  }),
});

builder.objectType(Comment, {
  name: 'Comment',
  fields: (t) => ({
    id: t.exposeID('id'),
    comment: t.exposeString('comment'),
    author: t.field({
      type: User,
      nullable: true,
      resolve: (comment) => Users.get(comment.id),
    }),
    post: t.field({
      type: Post,
      resolve: (comment) => Posts.get(comment.id)!,
    }),
  }),
});

const DEFAULT_PAGE_SIZE = 10;

builder.queryType({
  fields: (t) => ({
    post: t.field({
      type: Post,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: (root, args) => Posts.get(String(args.id)),
    }),
    posts: t.field({
      type: [Post],
      nullable: true,
      args: {
        take: t.arg.int(),
        skip: t.arg.int(),
      },
      resolve: (root, args) =>
        [...Posts.values()].slice(args.skip ?? 0, args.take ?? DEFAULT_PAGE_SIZE),
    }),
    user: t.field({
      type: User,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: (root, args) => Users.get(String(args.id)),
    }),
  }),
});

export const schema = builder.toSchema({});
