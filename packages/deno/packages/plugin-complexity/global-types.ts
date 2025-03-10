// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FieldNullability, InputFieldMap, InputShapeFromFields, SchemaTypes, TypeParam, } from '../core/index.ts';
import type { ComplexityPluginOptions, FieldComplexity } from './types.ts';
import type { GiraphQLComplexityPlugin } from './index.ts';
declare global {
    export namespace GiraphQLSchemaTypes {
        export interface Plugins<Types extends SchemaTypes> {
            complexity: GiraphQLComplexityPlugin<Types>;
        }
        export interface SchemaBuilderOptions<Types extends SchemaTypes> {
            complexity?: ComplexityPluginOptions<Types>;
        }
        export interface BuildSchemaOptions<Types extends SchemaTypes> {
            complexity?: ComplexityPluginOptions<Types>;
        }
        export interface FieldOptions<Types extends SchemaTypes = SchemaTypes, ParentShape = unknown, Type extends TypeParam<Types> = TypeParam<Types>, Nullable extends FieldNullability<Type> = FieldNullability<Type>, Args extends InputFieldMap = InputFieldMap, ResolveShape = unknown, ResolveReturnShape = unknown> {
            complexity?: FieldComplexity<Types["Context"], InputShapeFromFields<Args>>;
        }
    }
}
