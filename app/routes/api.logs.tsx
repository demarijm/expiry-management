import { json, LoaderFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export const loader: LoaderFunction = async function ({ request }) {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const take = Number(url.searchParams.get("take")) || 10;
  const cursor = Number(url.searchParams.get("cursor")) || null;

  const args: any = {
    take,
    where: {
        shop: session.shop
    },
    orderBy: {
        id: 'asc',
    },
  };

  if (cursor) {
    args.cursor = {
      id: cursor,
    };
    args.skip = 1;
  }

  const logs = await prisma.logs.findMany(args);
//   const nextCursor = logs.length === take ? logs[logs.length - 1].id : null;

  return json({
    logs
  });
};
