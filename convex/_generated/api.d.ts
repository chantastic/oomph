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
import type * as assignee from "../assignee.js";
import type * as assigneeAssignment from "../assigneeAssignment.js";
import type * as assigneeAssignmentDescriptor from "../assigneeAssignmentDescriptor.js";
import type * as cronJobs from "../cronJobs.js";
import type * as userAssignee from "../userAssignee.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assignee: typeof assignee;
  assigneeAssignment: typeof assigneeAssignment;
  assigneeAssignmentDescriptor: typeof assigneeAssignmentDescriptor;
  cronJobs: typeof cronJobs;
  userAssignee: typeof userAssignee;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
