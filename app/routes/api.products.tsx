import { json, LoaderFunction } from "@remix-run/node";
import { getExpirationDateStatus } from "app/features/expiration-manager/utils/utils";
import { authenticate } from "app/shopify.server";
import { isAfter, isBefore } from "date-fns";

export const loader: LoaderFunction = async function ({ request }) {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const first = Number(url.searchParams.get("first")) || null;
  const last = Number(url.searchParams.get("last")) || null;
  const after = url.searchParams.get("after") || null;
  const before = url.searchParams.get("before") || null;

  const variables = {
    first,
    after,
    last,
    before,
  };

  const response = await admin.graphql(
    `#graphql
            query getAllProducts($first: Int, $after: String,$last: Int, $before: String) {
              products(first: $first, after: $after, last: $last, before: $before) {
                edges {
                  node {
                    id
                    featuredMedia {
                        preview {
                            image {
                                url
                            }
                        }
                    }
                    title
                    handle
                    status
                    tags
                    totalInventory
                    metafields(first: 3, namespace: "expiration_manager") {
                        edges {
                            node {
                                key
                                value
                            }
                        }
                    }
                    variants(first: 10) {
                        edges {
                            node {
                                id
                                price
                                barcode
                                createdAt
                            }
                        }
                    }
                  }
                  cursor
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                }
              }
            }`,
    { variables },
  );

  const { data } = await response.json();

  const today = new Date();

  const products = data?.products.edges.map((row: any) => {
    const { node } = row;

    const expirationDateField = node.metafields.edges.find(
      (metafield: any) => metafield.node.key === "expiration_date",
    );
    const expirationAlertDateField = node.metafields.edges.find(
      (metafield: any) => metafield.node.key === "expiration_warning_date",
    );
    const expirationDateStatusField = node.metafields.edges.find(
      (metafield: any) => metafield.node.key === "expiration_status",
    );

    const expirationDate = expirationDateField?.node.value || null;
    const expirationAlertDate = expirationAlertDateField?.node.value || null;
    const expirationStatus =
      getExpirationDateStatus(expirationDateStatusField?.node) || false;

    return {
      ...node,
      expirationDate,
      expirationAlertDate,
      expirationStatus,
      expired: expirationDate && isAfter(today, new Date(expirationDate)),
      expiringSoon:
        expirationAlertDate &&
        isAfter(today, new Date(expirationAlertDate)) &&
        isBefore(today, new Date(expirationDate)),
    };
  });

  const paginatedData = {
    products,
    pageInfo: data?.products.pageInfo
  }

  return json({
    data: paginatedData
  });
};
