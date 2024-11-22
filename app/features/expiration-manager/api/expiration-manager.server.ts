import {
  AdminApiContext,
} from "@shopify/shopify-app-remix/server";
import { Metafields } from "app/constants/metafields";
import { getExpirationDateStatus } from "../utils/utils";
import { isAfter, isBefore } from "date-fns";
import { addLogs } from "app/services/logs.server";

export type AddPayload = {
  productId: number;
  expirationDate: string;
};

export type UpdatePayload = {
  productId: number;
  fieldId: number | null;
  expirationDate: string;
};

export async function getAllProducts(
  admin: AdminApiContext,
  limit: number = 250,
  filter: string = "all",
) {
  try {
    let allProducts: any[] = [];
    let hasNextPage;

    const variables = {
      first: limit,
      after: null,
    };

    do {
      const response = await admin.graphql(
        `#graphql
            query getAllProducts($first: Int!, $after: String) {
              products(first: $first, after: $after) {
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
                  endCursor
                }
              }
            }`,
        { variables },
      );

      const { data } = await response.json();
      hasNextPage = data?.products?.pageInfo.hasNextPage;

      variables.after = data?.products?.pageInfo.endCursor;

      const today = new Date();

      const products = data?.products.edges.map((row: any) => {
        const { node, cursor } = row;

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
        const expirationAlertDate =
          expirationAlertDateField?.node.value || null;
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
          cursor,
        };
      });

      allProducts = [...allProducts, ...products];
    } while (hasNextPage);

    if (filter === "all") {
      return allProducts;
    } else if (filter === "active") {
      return allProducts?.filter((product) => product.expirationStatus) || [];
    } else if (filter === "inactive") {
      return allProducts?.filter((product) => !product.expirationStatus) || [];
    } else if (filter === "expired") {
      return allProducts?.filter((product) => product.expired) || [];
    } else if (filter === "expiring") {
      return allProducts.filter((product) => product.expiringSoon) || [];
    } else {
      return [];
    }
  } catch (error) {
    console.log("getAllProducts Error >> ", error);
    return [];
  }
}

export async function getProductStats(admin: AdminApiContext) {
  const allProducts = await getAllProducts(admin);

  const activeCount = allProducts.filter((product) => product.expirationStatus);
  const inActiveCount = allProducts.filter(
    (product) => !product.expirationStatus,
  );
  const expiredCount = allProducts.filter((product) => product.expired);
  const expireSoonCount = allProducts.filter((product) => product.expiringSoon);

  return {
    active: activeCount?.length || 0,
    expired: expiredCount?.length || 0,
    expireSoon: expireSoonCount?.length || 0,
    inactive: inActiveCount?.length || 0,
  };
}

export async function getProductMetafieldDefinition(
  admin: AdminApiContext,
  namespace: string,
  key: string,
) {
  const response = await admin.graphql(
    `#graphql
        query {
            metafieldDefinitions(first: 1, ownerType: PRODUCT, namespace: "${namespace}", key: "${key}") {
                edges {
                    node {
                        id,
                        name,
                        key,
                        namespace,
                    }
                }
            }
        }`,
  );

  const { data } = await response.json();
  return data?.metafieldDefinitions?.edges[0] || null;
}

export async function addProductMetafieldDefinition(
  admin: AdminApiContext,
  name: string,
  namespace: string,
  key: string,
  description: string,
  type: string,
) {
  const existingDefinition = await getProductMetafieldDefinition(
    admin,
    namespace,
    key,
  );

  if (!existingDefinition) {
    const response = await admin.graphql(
      `#graphql
          mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                name,
                key,
                namespace,
              }
              userErrors {
                field
                message
                code
              }
            }
          }`,
      {
        variables: {
          definition: {
            name,
            namespace,
            key,
            description,
            type,
            ownerType: "PRODUCT",
          },
        },
      },
    );

    const { data } = await response.json();
    const newDefinition = data?.metafieldDefinitionCreate?.createdDefinition;

    console.log(
      "Product expiration date metafield definition was successfully added! >> ",
      newDefinition,
    );
  }
}

export async function getProductMetafield(
  admin: AdminApiContext,
  productId: string,
  namespace: string,
  key: string,
) {
  const response = await admin.graphql(
    `#graphql
        query {
          product(id: "${productId}") {
            ... on Product {
              metafield(namespace: "${namespace}", key: "${key}") {
                id
                namespace
                key
                description
                value
              }
            }
          }
        }`,
  );

  const { data } = await response.json();
  return data?.product?.metafield;
}

export async function addProductMetafield(
  admin: AdminApiContext,
  productId: string,
  namespace: string,
  key: string,
  type: string,
  value: string,
) {
  const response = await admin.graphql(
    `#graphql
      mutation updateProductMetafields($input: ProductUpdateInput!) {
        productUpdate(product: $input) {
          product {
            id
            metafields(first: 1) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            message
            field
          }
        }
      }`,
    {
      variables: {
        input: {
          metafields: [
            {
              namespace,
              key,
              type,
              value,
            },
          ],
          id: productId,
        },
      },
    },
  );

  const { data } = await response.json();
  return data?.product?.metafields?.edges[0];
}

export async function updateProductMetafield(
  admin: AdminApiContext,
  productId: string,
  metafieldId: string,
  value: string,
) {
  const response = await admin.graphql(
    `#graphql
    mutation updateProductMetafields($input: ProductUpdateInput!) {
        productUpdate(product: $input) {
        product {
            id
            metafields(first: 1) {
            edges {
                node {
                id
                namespace
                key
                value
                }
            }
            }
        }
        userErrors {
            message
            field
        }
        }
    }`,
    {
      variables: {
        input: {
          metafields: [
            {
              id: metafieldId,
              value: value,
            },
          ],
          id: productId,
        },
      },
    },
  );

  const { data } = await response.json();
  return data?.product?.metafields?.edges[0];
}

export async function upsertProductExpirationDate(
  admin: AdminApiContext,
  shop: string,
  productId: string,
  value: string,
) {
  let metafield = null;
  const { namespace, key, value_type } = Metafields.expiration_date;

  const expirationDateMetafield = await await getProductMetafield(
    admin,
    productId,
    namespace,
    key,
  );

  if (expirationDateMetafield) {
    metafield = await updateProductMetafield(
      admin,
      productId,
      expirationDateMetafield.id,
      value,
    );

    await addLogs({
      shop,
      action: 'product.expiration_date.update',
      description: `Update product expiration date to ${value}`,
      type: 'success'
    });
  } else {
    metafield = await addProductMetafield(
      admin,
      productId,
      namespace,
      key,
      value_type,
      value,
    );

    await addLogs({
      shop,
      action: 'product.expiration_date.add',
      description: `Add product expiration date - ${value}`,
      type: 'success'
    });
  }

  return metafield;
}

export async function upsertProductWarningDate(
  admin: AdminApiContext,
  shop: string,
  productId: string,
  value: string,
) {
  let metafield = null;
  const { namespace, key, value_type } = Metafields.expiration_warning_date;

  const expirationDateMetafield = await await getProductMetafield(
    admin,
    productId,
    namespace,
    key,
  );

  if (expirationDateMetafield) {
    metafield = await updateProductMetafield(
      admin,
      productId,
      expirationDateMetafield.id,
      value,
    );

    await addLogs({
      shop,
      action: 'product.expiration_warning_date.update',
      description: `Update product expiration alert date to ${value}`,
      type: 'success'
    });
  } else {
    metafield = await addProductMetafield(
      admin,
      productId,
      namespace,
      key,
      value_type,
      value,
    );

    await addLogs({
      shop,
      action: 'product.expiration_warning_date.add',
      description: `Add product expiration alert date - ${value}`,
      type: 'success'
    });
  }

  return metafield;
}

export async function upsertProductExpirationDateStatus(
  admin: AdminApiContext,
  shop: string,
  productId: string,
  value: string,
) {
  let metafield = null;
  const { namespace, key, value_type } = Metafields.expiration_status;

  const expirationDateMetafield = await await getProductMetafield(
    admin,
    productId,
    namespace,
    key,
  );

  if (expirationDateMetafield) {
    metafield = await updateProductMetafield(
      admin,
      productId,
      expirationDateMetafield.id,
      value,
    );

    await addLogs({
      shop,
      action: 'product.expiration_status.update',
      description: `Update product expiration status set to ${value}`,
      type: 'success'
    });
  } else {
    metafield = await addProductMetafield(
      admin,
      productId,
      namespace,
      key,
      value_type,
      value,
    );

    await addLogs({
      shop,
      action: 'product.expiration_status.add',
      description: `Add product expiration status set to ${value}`,
      type: 'success'
    });
  }

  return metafield;
}
