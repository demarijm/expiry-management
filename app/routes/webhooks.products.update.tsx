import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { addProductMetafieldDefinition } from "app/features/expiration-manager/api/expiration-manager.server";
import { Metafields } from "app/constants/metafields";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.webhook(request);
  // const { admin } = await authenticate.admin(request);

  if (!session) {
    return new Response();
  }
  console.log(
    "===================== > Received products update webhook < ===================",
  );

  return new Response();
};
