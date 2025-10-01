import { useConvex } from "convex/react";
import { useEffect, useState } from "react";

export function useQuerySuspense(query: any, args?: any) {
  const convex = useConvex();
  const watch = args ? convex.watchQuery(query, args) : convex.watchQuery(query);
  const initialValue = watch.localQueryResult();

  if (initialValue === undefined) {
    throw new Promise<void>((resolve) => {
      watch.onUpdate(() => {
        resolve();
      });
    });
  }

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const updateValueFromQueryResult = () => {
      const result = watch.localQueryResult();
      if (result === undefined) throw new Error("No query result");
      setValue(result);
    };

    updateValueFromQueryResult();
    return watch.onUpdate(updateValueFromQueryResult);
  }, [watch]);

  return value;
}
