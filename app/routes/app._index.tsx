import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, json, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Grid,
  Box,
  Text,
} from "@shopify/polaris";
import {
  StatusActiveIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  DisabledIcon,
} from "@shopify/polaris-icons";
import StatCard from "app/features/expiration-manager/components/stat-card";
import { getProductStats } from "app/features/expiration-manager/api/expiration-manager.server";
import { authenticate } from "app/shopify.server";
import { usePaginatedProducts } from "app/features/expiration-manager/hooks/usePaginatedProducts";
import PaginatedProductTable from "app/features/expiration-manager/components/paginated-product-table";
import LogsTable from "app/features/audit-logs/components/logs-table";
import { getRecentLogs } from "app/services/logs.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const stats = await getProductStats(admin);
  const logs = await getRecentLogs(session.shop, 10);

  return json({
    stats,
    logs,
  });
};

export default function Index() {
  const PER_PAGE = 10;

  const { stats, logs } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const { data, loading, error, nextPage, previousPage } = usePaginatedProducts(
    { limit: PER_PAGE },
  );

  return (
    <Page title="Dashboard" subtitle="App Overview" compactTitle>
      <BlockStack gap="800">
        <Layout sectioned>
          <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }}>
            <Grid.Cell>
              <StatCard
                title="Active"
                value={stats?.active}
                tone="success"
                icon={StatusActiveIcon}
                action="View active products"
                actionCallback={() => navigate("/app/products?q=active")}
              />
            </Grid.Cell>

            <Grid.Cell>
              <StatCard
                title="Soon to expire"
                value={stats.expireSoon}
                tone="warning"
                icon={AlertTriangleIcon}
                action="View soon-to-expire products"
                actionCallback={() => navigate("/app/products?q=expiring")}
              />
            </Grid.Cell>

            <Grid.Cell>
              <StatCard
                title="Expired"
                value={stats.expired}
                tone="critical"
                icon={AlertCircleIcon}
                action="View expired products"
                actionCallback={() => navigate("/app/products?q=expired")}
              />
            </Grid.Cell>

            <Grid.Cell>
              <StatCard
                title="Inactive"
                value={stats.inactive}
                tone="subdued"
                icon={DisabledIcon}
                action="View inactive products"
                actionCallback={() => navigate("/app/products?q=inactive")}
              />
            </Grid.Cell>
          </Grid>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <PaginatedProductTable
                products={data?.products || []}
                onNextPage={nextPage}
                onPreviousPage={previousPage}
                pageInfo={data.pageInfo}
                loading={loading}
              />
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingSm">
                Recent Logs
              </Text>
              <Box paddingBlockStart="200">
                <LogsTable logs={logs} />
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
