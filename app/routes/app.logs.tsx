import { LoaderFunctionArgs } from "@remix-run/node";
import { Button, Card, Layout, Page } from "@shopify/polaris";
import LogsTable from "app/features/audit-logs/components/logs-table";
import { usePaginatedLogs } from "app/features/audit-logs/hooks/usePaginatedLogs";
import { authenticate } from "app/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return null;
};

export default function ProductsPage() {
  // const { logs } = useLoaderData<typeof loader>();

  const { logs, loading, error, loadMore  } = usePaginatedLogs(10);

  return (
    <Page title="Audit Logs" compactTitle backAction={{ content: "Products", url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <LogsTable logs={logs} loading={loading} />

            <Button onClick={loadMore}>Load More...</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
