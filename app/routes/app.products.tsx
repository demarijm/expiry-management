import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, Layout, Page } from "@shopify/polaris";
import { getAllProducts } from "app/features/expiration-manager/api/expiration-manager.server";
import ProductTable from "app/features/expiration-manager/components/product-table";
import { authenticate } from "app/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || 'all';

  const products = await getAllProducts(admin, 250, query);

  return json({
    products
  });
};

export default function ProductsPage() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Page title="Products" compactTitle backAction={{ content: "Products", url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <ProductTable products={loaderData.products} />
          </Card>

        </Layout.Section>
      </Layout>
    </Page>
  );
}
