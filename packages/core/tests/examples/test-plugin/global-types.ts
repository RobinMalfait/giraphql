/* eslint-disable @typescript-eslint/no-unused-vars */
import { FieldNullability, InputFieldMap, SchemaTypes, TypeParam } from '../../../src';
import { GiraphQLTestPlugin } from './plugin';

declare global {
  export namespace GiraphQLSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      test: GiraphQLTestPlugin<Types>;
    }

    export interface InterfaceFieldOptions<
      Types extends SchemaTypes,
      ParentShape,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      ResolveReturnShape,
    > {
      exampleRequiredOptionFromPlugin: boolean;
    }
  }
}
