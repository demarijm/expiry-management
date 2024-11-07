import { json } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export async function loadProducts(request: Request) {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
        `#graphql
      query getAllProducts {
        products(first: 10) {
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
              metafields(first: 50) {
                edges {
                  node {
                    id
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
          }
        }
      }`,
    );
    const responseJson = await response.json();

    return json({
        products: responseJson!.data.products.edges,
    });
}

export async function generateProduct(request: Request) {
    const { admin } = await authenticate.admin(request);
    const color = ["Red", "Orange", "Yellow", "Green"][
        Math.floor(Math.random() * 4)
    ];
    const response = await admin.graphql(
        `#graphql
            mutation populateProduct($input: ProductInput!) {
              productCreate(input: $input) {
                product {
                  id
                  title
                  handle
                  status
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
              }
            }`,
        {
            variables: {
                "input": {
                    "title": `${color} Snowboard`,
                },
            },
        },
    );
    const responseJson = await response.json();

    const product = responseJson.data!.productCreate!.product!;
    const variantId = product.variants.edges[0]!.node!.id!;

    const variantResponse = await admin.graphql(
        `#graphql
          mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants {
                id
                price
                barcode
                createdAt
              }
            }
          }`,
        {
            variables: {
                productId: product.id,
                variants: [{ id: variantId, price: "100.00" }],
            },
        },
    );

    const variantResponseJson = await variantResponse.json();

    return json({
        product: responseJson!.data!.productCreate!.product,
        variant:
            variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
    });
}