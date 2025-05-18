import { useEffect, useRef } from "react";

/**
 * Custom hook that runs a callback function when the component unmounts.
 * @param callback - The function to be called on unmount
 */
const useUnmount = (onUnmount: () => void): void => {
    // Stored in ref to avoid running the callback on every render
    const unmountHandler = useRef<() => void>(onUnmount);

    useEffect(() => {
        unmountHandler.current = onUnmount;
    }, [onUnmount]);

    useEffect(() => () => unmountHandler.current(), []);
}

export default useUnmount;