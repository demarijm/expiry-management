import { useEffect, useState } from "react";

export const usePaginatedLogs = function(take: number) {
    
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState<any>([]);
    const [cursor, setCursor] = useState(null)

    function loadMore() {
        const nextCursor = logs.length ? logs[logs.length - 1].id : null;
        setCursor(nextCursor);
    }

    useEffect(() => {
        async function getLogs(query: string) {
            try {
                setLoading(true);
                const res = await fetch(`/api/logs?${query}`);
                const result = await res.json();

                const appendLogs = result.logs;
    
                setLogs([...logs, ...appendLogs]);
                setError(null);
            } catch (error: any) {
                setError(error)
            } finally {
                setLoading(false);
            }
        }

        const queryParams = [`take=${take}`];

        if(cursor) {
            queryParams.push(`cursor=${cursor}`);
        }

        const query = queryParams.join("&");

        getLogs(query);

    }, [cursor]);

    return {
        logs,
        loading,
        error,
        loadMore
    }
}