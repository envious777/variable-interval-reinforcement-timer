import { useEffect } from "react";

/**
 * Custom hook that runs a callback function when the component unmounts.
 * @param callback - The function to be called on unmount
 */
const useUnmount = (callback: () => void) => {
    useEffect(() => {
        return () => {
            callback();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export default useUnmount;