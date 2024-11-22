import { useEffect, useState } from "react";

export type PageInfoProps = {
    limit: number
}

type Pagination = {
    first: number | null,
    after: string | null,
    last: number | null,
    before: string |null,
}

export const usePaginatedProducts = function(pageInfo: PageInfoProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState<any>({});

    const [pagination, setPagination] = useState<Pagination>({
        first: pageInfo.limit,
        after: null,
        last: null,
        before: null,
      });

    function nextPage(after: string | null) {
        setPagination({
            first: pageInfo.limit,
            after,
            last: null,
            before: null,
        });
    }

    function previousPage(before: string | null) {
        setPagination({
            first: null,
            after: null,
            last: pageInfo.limit,
            before,
        });
    }

    useEffect(() => {
        async function getProducts(query: string) {
            try {
                setLoading(true);
                const res = await fetch(`/api/products?${query}`);
                const result = await res.json();
    
                setData(result.data);
                setError(null);
            } catch (error: any) {
                setError(error)
            } finally {
                setLoading(false);
            }
        }

        const queryParams = [];

        if(pagination.first) {
            queryParams.push(`first=${pagination.first}`);
        }

        if(pagination.after) {
            queryParams.push(`after=${pagination.after}`);
        }

        if(pagination.last) {
            queryParams.push(`last=${pagination.last}`);
        }

        if(pagination.before) {
            queryParams.push(`before=${pagination.before}`);
        }

        const query = queryParams.join("&");

        getProducts(query);

    }, [pagination]);

    return {
        data,
        loading,
        error,
        nextPage,
        previousPage
    }
}