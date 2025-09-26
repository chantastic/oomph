/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assignees from "../assignees.js";
import type * as assignments from "../assignments.js";
import type * as migrations_20250126130000__add_assignment_type_to_completions from "../migrations/20250126130000__add_assignment_type_to_completions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assignees: typeof assignees;
  assignments: typeof assignments;
  "migrations/20250126130000__add_assignment_type_to_completions": typeof migrations_20250126130000__add_assignment_type_to_completions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
