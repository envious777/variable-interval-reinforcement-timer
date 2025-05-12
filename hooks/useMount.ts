import { useEffect } from "react";

/**
 * Custom hook that runs a callback function when the component mounts.
 * @param callback - The function to be called on mount
 */
const useMount = (callback: () => void) => {
    useEffect(() => {
        callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useMount;