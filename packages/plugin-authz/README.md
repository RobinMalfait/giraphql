# AuthZ plugin

This is a simple plugin for integrating with
[GraphQL AuthZ](https://github.com/apigee/graphql-authz)

For more details on GraphQL AuthZ see the official
[documentation here](https://github.com/apigee/graphql-authz)

## Usage

### Install

```bash
yarn add @giraphql/plugin-authz
```

### Setup

```typescript
import AuthzPlugin from '@giraphql/plugin-authz';

const builder = new SchemaBuilder<{
  AuthZRule: keyof typeof rules;
}>({
  plugins: [AuthzPlugin],
});
```

This plugin will add the rules to your schema, but you will still need to set up your server (or
execute function) to run the authorization checks. The implementation of this depends on how your
app is set up.

A simple example that just wraps the execute function might look like:

```typescript
import { execute } from 'graphql';
import { wrapExecuteFn } from '@graphql-authz/core';
import rules from './auth-rules';

const wrappedExecute = wrapExecuteFn(execute, { rules });
```

## Defining rules for fields

```typescript
builder.queryType({
  fields: (t) => ({
    users: t.field({
      type: [User],
      authz: {
        rules: ['IsAuthenticated'],
      },
      resolve: () => users,
    }),
  }),
});
```

## Defining rules for types

```typescript
const Post = builder.objectRef<IPost>('Post');

Post.implement({
  authz: {
    rules: ['CanReadPost'],
  },
  fields: (t) => ({
    id: t.exposeID('id'),
  }),
});
```
