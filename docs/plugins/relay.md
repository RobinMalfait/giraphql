---
name: Relay
menu: Plugins
---

# Relay Plugin

The Relay plugin adds a number of builder methods a helper functions to simplify building a relay
compatible schema.

## Usage

### Install

```bash
yarn add @giraphql/plugin-relay
```

### Setup

```typescript
import RelayPlugin from '@giraphql/plugin-relay';
const builder = new SchemaBuilder({
  plugins: [RelayPlugin],
  relayOptions: {
    clientMutationId: 'omit',
    cursorType: 'String',
  },
});
```

### Options

The `relayOptions` object passed to builder can contain the following properties:

- `clientMutationId`: `required` (default) | `omit` | `optional`. Determins if clientMutationId
  fields are created on connections, and if they are required.
- `cursorType`: `String` | `ID`. Determines type used for cursor fields. Defaults behavior due to
  legacy reasons is `String` for everything except for connection arguments which use `ID`.
  Overwritting this default is hightly encouraged.
- `nodeQueryOptions`: Options for the `node` field on the query object
- `nodesQueryOptions`: Options for the `nodes` field on the query object
- `nodeTypeOptions`: Options for the `Node` interface type
- `pageInfoTypeOptions`: Options for the `TypeInfo` object type
- `clientMutationIdFieldOptions`: Options for the `clientMutationId` field on connection objects
- `clientMutationIdInputOptions`: Options for the `clientMutationId` input field on connections
  fields
- `mutationInputArgOptions`: Options for the Input object created for each connection field
- `cursorFieldOptions`: Options for the `cursor` field on an edge object.
- `nodeFieldOptions`: Options for the `node` field on an edge object.
- `edgesFieldOptions`: Options for the `edges` field on a connection object.
- `pageInfoFieldOptions`: Options for the `pageInfo` field on a connection object.
- `hasNextPageFieldOptions`: Options for the `hasNextPage` field on the `PageInfo` object.
- `hasPreviousPageFieldOptions`: Options for the `hasPreviousPage` field on the `PageInfo` object.
- `startCursorFieldOptions`: Options for the `startCursor` field on the `PageInfo` object.
- `endCursorFieldOptions`: Options for the `endCursor` field on the `PageInfo` object.
- `beforeArgOptions`: Options for the `before` arg on a connection field.
- `afterArgOptions`: Options for the `after` arg on a connection field.
- `firstArgOptions`: Options for the `first` arg on a connection field.
- `lastArgOptions`: Options for the `last` arg on a connection field.

### Global IDs

To make it easier to create globally unique ids the relay plugin adds new methods for creating
globalID fields.

```typescript
import { encodeGlobalID } from '@giraphql/plugin-relay';

builder.queryFields((t) => ({
  singleID: t.globalID({
    resolve: (parent, args, context) => {
      return encodeGlobalID('SomeType', 123);
    },
  }),
  listOfIDs: t.globalIDList({
    resolve: (parent, args, context) => {
      return [{ id: 123, type: 'SomeType' }];
    },
  }),
}));
```

The returned IDs can either be a string \(which is expected to already be a globalID\), or an object
with the an `id` and a `type`, The type can be either the name of a name as a string, or any object
that can be used in a type parameter.

There are also new methods for adding globalIDs in arguments or fields of input types:

```typescript
builder.queryType({
  fields: (t) => ({
    fieldThatAcceptsGlobalID: t.boolean({
      args: {
        id: t.arg.globalID({
          required: true,
        }),
        idList: t.arg.globalIDList(),
      },
      resolve(parent, args) {
        console.log(`Get request for type ${args.id.type} with id ${args.id.typename}`);
        return true;
      },
    }),
  }),
});
```

globalIDs used in arguments expect the client to send a globalID string, but will automatically be
converted to an object with 2 properties (`id` and `typename`) before they are passed to your
resolver in the arguments object.

### Creating Nodes

To create objects that extend the `Node` interface, you can use the new `builder.node` method.

```typescript
class NumberThing {
  id: number;

  binary: string;

  constructor(n: number) {
    this.id = n;
    this.binary = n.toString(2);
  }
}

builder.node(NumberThing, {
  id: {
    resolve: (num) => num.id,
    // other options for id field can be added here
  },
  loadOne: (id) => new NumberThing(parseInt(id)),
  loadMany: (ids) => ids.map((id) => new NumberThing(parseInt(id))),
  name: 'Number',
  fields: (t) => ({
    binary: t.exposeString('binary', {}),
  }),
});
```

`builder.node` will create an object type that implements the `Node` interface. It will also create
the `Node` interface the first time it is used. The `resolve` function for `id` should return a
number or string, which will be converted to a globalID. The `loadOne` and `loadMany` methods are
optional, and `loadMany` will be used if both are present. These methods allow a nodes to be loaded
by id. The relay plugin adds to new query fields `node` and `nodes` which can be used to directly
fetch nodes using global IDs.

Nodes may also implement an `isTypeOf` method which can be used to resolve the correct type for
lists of generic nodes. When using a class as the type parameter, the `isTypeOf` method defaults to
using an `instanceof` check, and falls back to checking the constructor property on the prototype.
The means that for many cases if you are using classes in your type parameters, and all your values
are instances of those classes, you won't need to implement an `isTypeOf` method, but it is ussually
better to explicitly define that behavior.

### Creating Connections

The `t.connection` field builder method can be used to define connections. This method will
automatically create the `Connection` and `Edge` objects used by the connection, and add `before`,
`after`, `first`, and `last` arguments. The first time this method is used, it will also create the
`PageInfo` type.

```typescript
builder.queryFields((t) => ({
  numbers: t.connection(
    {
      type: NumberThing,
      resolve: (parent, { first, last, before, after }) => {
        return resolveOffsetConnection({ args }, ({ limit, offset }) => {
          return {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'abc',
              endCursor: 'def',
            },
            edges: [
              {
                cursor: 'xyz',
                node: new NumberThing(123),
              },
            ],
          };
        });
      },
    },
    {
      name: 'NameOfConnectionType', // optional, will use ParentObject + capitalize(FieldName) + "Connection" as the default
      fields: (tc) => ({
        // define extra fields on Connection
        // We need to use a new variable for the connection field builder (eg tc) to get the correct types
      }),
      // Other options for connection object can be added here
    },
    {
      // Same as above, but for the Edge Object
      name: 'NameOfEdgeType', // optional, will use Connection name + "Edge" as the default
      fields: (te) => ({
        // define extra fields on Edge
        // We need to use a new variable for the connection field builder (eg te) to get the correct types
      }),
    },
  ),
}));
```

Manually implementing connections can be cumbersome, so there are a couple of helper methods that
can make resolving connections a little easier.

For limit/offset based apis:

```typescript
import { resolveOffsetConnection } from '@giraphql/plugin-relay';

builder.queryFields((t) => ({
  numbers: t.connection({
    type: SomeThings,
    resolve: (parent, args) => {
      return resolveOffsetConnection({ args }, ({ limit, offset }) => {
        return getThings(offset, limit);
      });
    },
  }),
}));
```

`resolveOffsetConnection` has a few default limits to prevent unintentionally allowing too many
records to be fetched at once. These limits can be configure using the following options:

```typescript
{
  args: ConnectionArguments;
  defaultSize?: number; // defaults to 20
  maxSize?: number; // defaults to 100
}
```

For APIs where you have the full array available you can use `resolveArrayConnection`, which works
just like `resolveOffsetConnection` and accepts the same options.

```typescript
import { resolveArrayConnection } from '@giraphql/plugin-relay';

builder.queryFields((t) => ({
  numbers: t.connection({
    type: SomeThings,
    resolve: (parent, args) => {
      return resolveOffsetConnection({ args }, getAllTheThingsAsArray());
    },
  }),
}));
```

I am planning to add more helpers in the future.

### Relay Mutations

You can use the `relayMutationField` method to define relay compliant mutation fields. This method
will generate a mutation field, an input object with a `clientMutationId` field, and an output
object with the corresponding `clientMutationId`.

Example ussage:

```typescript
builder.relayMutationField(
  'deleteItem',
  {
    inputFields: (t) => ({
      id: t.id({
        required: true,
      }),
    }),
  },
  {
    resolve: async (root, args, ctx) => {
      if (ctx.items.has(args.input.id)) {
        ctx.items.delete(args.input.id);

        return { success: true };
      }

      return { sucess: false };
    },
  },
  {
    outputFields: (t) => ({
      sucess: t.boolean({
        resolve: (result) => result.success,
      }),
    }),
  },
);
```

Which produces the following graphql types:

```graphql
input DeleteItemInput {
  clientMutationId: ID!
  id: ID!
}

type DeleteItemPayload {
  clientMutationId: ID!
  itWorked: Boolean!
}

type Mutation {
  deleteItem(input: DeleteItemInput!): DeleteItemPayload!
}
```

The `relayMutationField` has 4 arguments:

- `name`: Name of the mutation field
- `inputOptions`: Options for the `input` object
- `fieldOptions`: Options for the mutation field
- `payloadOptions`: Options for the Payload object

The `inputOptions` has a couple of non-standard options:

- `name` which can be used to set the name of the input object
- `argName` which can be used to overwrite the default arguments name (`input`).

The `payloadOptions` object also accepts a `name` property for setting the name of the payload
object.

You can also access refs for the created input and payload objects so you can re-use them in other fields:

```typescript
// Using aliases when destructuring lets you name your refs rather than using the generic `inputType` and `payloadType`
const { inputType: DeleteItemInput, payloadType: DeleteItemPayload } = builder.relayMutationField(
  'deleteItem',
  ...
);
```

### Reusing connection objects

In some cases you may want to create a connection object type that is shared by multiple fields. To
do this, you will need to create the connection object separately and then create a fields using a
ref to your connection object:

```typescript
import { resolveOffsetConnection } from '@giraphql/plugin-relay';

const ThingsConnection = builder.connectionObject(
  {
    // connection optionss
    type: SomeThing,
    name: 'ThingsConnection',
  },
  {
    // Edge options (optional)
    name: 'ThingsEdge', // defaults to Appending `Edge` to the Connection name
  },
);

builder.queryFields((t) => ({
  things: t.connection({
    type: ThingsConnection,
    args: {
      ...t.arg.connectionArgs(),
    },
    resolve: (parent, args) => {
      return resolveOffsetConnection({ args }, ({ limit, offset }) => {
        return getThings(offset, limit);
      });
    },
  }),
}));
```

`builder.connectionObject` creates the connect object type and the associated Edge type.
`t.arg.connectionArgs()` will create the default connection args.

### Expose nodes

The `t.node` and `t.nodes` methods can be used to add additional node fields. the expected return
values of `id` and `ids` fields is the same as the resolve value of `t.globalID`, and can either be
a globalID or an object with and an `id` and a `type`.

Loading nodes by `id` uses a request cache, so the same node will only be loaded once per request,
even if it is used multiple times across the schema.

```typescript
builder.queryFields((t) => ({
  extraNode: t.node({
    id: () => 'TnVtYmVyOjI=',
  }),
  moreNodes: t.nodeList({
    ids: () => ['TnVtYmVyOjI=', { id: 10, type: 'SomeType' }],
  }),
}));
```

### decoding and encoding global ids

The relay plugin exports `decodeGlobalID` and `encodeGlobalID` as helper methods for interacting
with global IDs directly. If you accept a global ID as an argument you can use the `decodeGlobalID`
function to decode it:

```typescript
builder.mutationFields((t) => ({
  updateThing: t.field({
    type: Thing,
    args: {
      id: t.args.id({ required: true }),
      update: t.args.string({ required: true }),
    },
    resolve(parent, args) {
      const { type, id } = decodeGlobalId(args.id);

      const thing = Thing.findById(id);

      thing.update(args.update);

      return thing;
    },
  }),
}));
```

### Using custom encoding for global ids

In some cases you may want to encode global ids differently than the build in ID encoding. To do
this, you can pass a custom encoding and decoding function into the relay options of the builder:

```typescript
import '@giraphql/plugin-relay';
const builder = new SchemaBuilder({
  plugins: ['GiraphQLRelay'],
  relayOptions: {
    encodeGlobalID: (typename: string, id: string | number | bigint) => `${typename}:${id}`,
    decodeGlobalID: (globalID: string) => {
      const [typename, id] = globalID.split(':');

      return { typename, id };
    },
  },
});
```

### Extending all connections

There are 2 builder methods for adding fields to all connection objects: `t.globalConnectionField`
and `t.globalConnectionFields`. These methods work like many of the other methods on the builder for
adding fields to objects or interfaces.

```typescript
builder.globalConnectionField('totalCount', (t) =>
  t.int({
    nullable: false,
    resolve: (parent) => 123,
  }),
);
// Or
builder.globalConnectionFields((t) => ({
  totalCount: t.int({
    nullable: false,
    resolve: (parent) => 123,
  }),
}));
```

In the above example, we are just returning a static nubmer for our `totalCount` field. To make this
more useful, we need to have our resolvers for each connection actually return an object that
contains a totalCount for us. To guarantee that resolvers correclty implement this behavior, we can
define custom properties that must be returned from connection resolvers when we set up our builder:

```typescript
import '@giraphql/plugin-relay';
const builder = new SchemaBuilder<{
  Connection: {
    totalCount: number;
  };
}>({
  plugins: ['GiraphQLRelay'],
  relayOptions: {},
});
```

Now typescript will ensure that objects returned from each connection resolver include a totalCount
property, which we can use in our connection fields:

```typescript
builder.globalConnectionField('totalCount', (t) =>
  t.int({
    nullable: false,
    resolve: (parent) => parent.totalCount,
  }),
);
```

Note that adding additional required properties will make it harder to use the provided connection
helpers since they will not automatically return your custom properties. You will need to manually
add in any custom props after gettig the result from the helpers:

```typescript
builder.queryFields((t) => ({
  posts: t.connection({
    type: Post,
    resolve: (parent, args, context) => {
      const postsArray = context.Posts.getAll();
      const result = resolveArrayConnection({ args }, postsArray);

      return result && { totalCount: postsArray.length, ...result };
    },
  }),
}));
```
