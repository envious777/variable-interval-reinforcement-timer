import { EffectCallback, useEffect } from "react";

/**
 * Custom hook that runs a callback function when the component mounts.
 * @param callback - The function to be called on mount
 */
const useMount = (onMount: EffectCallback): void =>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(onMount, []);

export default useMount;