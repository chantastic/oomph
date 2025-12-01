/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assignee from "../assignee.js";
import type * as assigneeAssignment from "../assigneeAssignment.js";
import type * as assigneeAssignmentDescriptor from "../assigneeAssignmentDescriptor.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as system from "../system.js";
import type * as userAssignee from "../userAssignee.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assignee: typeof assignee;
  assigneeAssignment: typeof assigneeAssignment;
  assigneeAssignmentDescriptor: typeof assigneeAssignmentDescriptor;
  constants: typeof constants;
  crons: typeof crons;
  system: typeof system;
  userAssignee: typeof userAssignee;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
