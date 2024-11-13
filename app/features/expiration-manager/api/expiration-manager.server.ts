import { authenticate } from "app/shopify.server";
import { METAFIELD_KEY, METAFIELD_NAMESPACE, METAFIELD_TYPE } from "../utils/constants";

export type AddPayload = {
    productId: number;
    expirationDate: string;
};

export type UpdatePayload = {
    productId: number;
    fieldId: number | null;
    expirationDate: string;
};

export async function getProductExpirationMetafieldDefinition(request: Request) {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
        `#graphql
        query {
            metafieldDefinitions(first: 250, ownerType: PRODUCT, namespace: "custom_field", key: "expiration_date") {
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

    return data?.metafieldDefinitions?.edges || [];
}

export async function addProductExpiryMetafieldDefinition(
    request: Request,
) {
    const { admin } = await authenticate.admin(request);

    const definitions = await getProductExpirationMetafieldDefinition(request);

    if(definitions.length === 0) {
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
                        name: "ExpirationDate",
                        namespace: METAFIELD_NAMESPACE,
                        key: METAFIELD_KEY,
                        description: "An expiration date of product..",
                        type: METAFIELD_TYPE,
                        ownerType: "PRODUCT",
                    },
                },
            },
        );
    
        const { data } = await response.json();
        const newDefinition = data?.metafieldDefinitionCreate?.createdDefinition;
    
        console.log("Product expiration date metafield definition was successfully added! >> ", newDefinition);
    }
}

export async function getProductExpiryDate(
    productId: number,
    request: Request,
) {
    const { admin, session } = await authenticate.admin(request);

    const { data } = await admin.rest.resources.Metafield.all({
        session: session,
        product_id: productId,
        key: METAFIELD_KEY,
        namespace: METAFIELD_NAMESPACE,
        type: METAFIELD_TYPE,
        limit: 1,
    });

    if (data.length === 0) {
        return null;
    }

    return data[0];
}

export async function addExpiryDate(request: Request, payload: AddPayload) {
    const { admin, session } = await authenticate.admin(request);

    const metafield = new admin.rest.resources.Metafield({ session: session });

    await addProductExpiryMetafieldDefinition(request);

    metafield.product_id = payload.productId;
    metafield.namespace = METAFIELD_NAMESPACE;
    metafield.key = METAFIELD_KEY;
    metafield.type = METAFIELD_TYPE;
    metafield.value = payload.expirationDate;

    await metafield.save({
        update: true,
    });

    return metafield;
}

export async function updateExpiryDate(
    request: Request,
    payload: UpdatePayload,
) {
    const { admin, session } = await authenticate.admin(request);

    await addProductExpiryMetafieldDefinition(request);

    const metafield = new admin.rest.resources.Metafield({ session: session });

    metafield.product_id = payload.productId;
    metafield.id = payload.fieldId;
    metafield.value = payload.expirationDate;

    await metafield.save({
        update: true,
    });

    return metafield;
}
