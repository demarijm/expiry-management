import { json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  Page,
  BlockStack,
  TextField,
  Layout,
  EmptyState,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { getLog } from "app/services/logs.server";
import { authenticate } from "app/shopify.server";

export const loader: LoaderFunction = async function ({ request, params }) {
  const { session } = await authenticate.admin(request);

  try {
    const id = params?.id || 0;
    const log = await getLog(Number(id), session.shop);

    return json({
      log,
    });
  } catch (error) {
    return json({
      error: true,
    });
  }
};

function LogPage() {
  const { log, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <Page>
        <Layout sectioned>
          <Card>
            <EmptyState
              heading="Something went wrong"
              action={{ content: "View All Logs", url: "/app/logs" }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Audit log not found</p>
            </EmptyState>
          </Card>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      narrowWidth
      title={log?.action + " log"}
      secondaryActions={[
        { content: "Delete", destructive: true, icon: DeleteIcon },
      ]}
      backAction={{ content: "Logs", url: "/app/logs" }}
    >
      <Card roundedAbove="sm">
        <BlockStack gap="400">
          <TextField
            label="Log ID:"
            value={log?.id}
            autoComplete="off"
            readOnly
          />

          <TextField
            label="Store:"
            value={log?.shop}
            autoComplete="off"
            readOnly
          />

          <TextField
            label="Action:"
            value={log?.action}
            autoComplete="off"
            readOnly
          />

          <TextField
            label="DateTime:"
            value={log?.occured_at}
            autoComplete="off"
            readOnly
          />

          <TextField
            label="Description:"
            value={log?.description}
            autoComplete="off"
            readOnly
            multiline={8}
          />
        </BlockStack>
      </Card>
    </Page>
  );
}

export default LogPage;
