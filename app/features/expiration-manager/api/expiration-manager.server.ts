import { authenticate } from "app/shopify.server";

export type AddPayload = {
    productId: number;
    expirationDate: string;
};

export type UpdatePayload = {
    productId: number;
    fieldId: number | null;
    expirationDate: string;
};

export async function getProductMetafieldDefinitions(request: Request) {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
        `#graphql
        query {
            metafieldDefinitions(first: 250, ownerType: PRODUCT) {
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

    return data?.metafieldDefinitions?.edges;
}

export async function getProductExpiryDate(productId: number, request: Request) {

    const { admin, session } = await authenticate.admin(request);

    const { data } = await admin.rest.resources.Metafield.all({
        session: session,
        product_id: productId,
        key: "expiration_date",
        namespace: "custom_field",
        type: "date",
        limit: 1
    });

    if (data.length === 0) {
        return null;
    }

    return data[0];
}

export async function addExpiryDate(
    request: Request,
    payload: AddPayload,
) {
    const { admin, session } = await authenticate.admin(request);

    const metafield = new admin.rest.resources.Metafield({ session: session });

    metafield.product_id = payload.productId;
    metafield.namespace = "custom_field";
    metafield.key = "expiration_date";
    metafield.type = "date";
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

    const metafield = new admin.rest.resources.Metafield({ session: session });

    metafield.product_id = payload.productId;
    metafield.id = payload.fieldId;
    metafield.value = payload.expirationDate;

    await metafield.save({
        update: true,
    });

    return metafield;

}