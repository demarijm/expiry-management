import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { addProductMetafieldDefinition } from "app/features/expiration-manager/api/expiration-manager.server";
import { Metafields } from "app/constants/metafields";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { admin } = await authenticate.admin(request);

	  // add expiration date metafield definition if does not exist yet
	  await addProductMetafieldDefinition(
		admin,
		"Expiration Date",
		Metafields.expiration_date.namespace,
		Metafields.expiration_date.key,
		Metafields.expiration_date.description,
		Metafields.expiration_date.value_type,
	  );
	
	  // add expiration warning date metafield definition if does not exist yet
	  await addProductMetafieldDefinition(
		admin,
		"Alert Date",
		Metafields.expiration_warning_date.namespace,
		Metafields.expiration_warning_date.key,
		Metafields.expiration_warning_date.description,
		Metafields.expiration_warning_date.value_type,
	  );
	
	  // add expiration date status metafield definition if does not exist yet
	  await addProductMetafieldDefinition(
		admin,
		"Expiration Status",
		Metafields.expiration_status.namespace,
		Metafields.expiration_status.key,
		Metafields.expiration_status.description,
		Metafields.expiration_status.value_type,
	  );

	return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
	const { apiKey } = useLoaderData<typeof loader>();

	return (
		<AppProvider isEmbeddedApp apiKey={apiKey}>
			<NavMenu>
				<Link to="/app" rel="home">
					Home
				</Link>
				<Link to="/app/products">Products</Link>
				<Link to="/app/logs">Audit logs</Link>
				<Link to="/app/settings">Settings</Link>
			</NavMenu>
			<Outlet />
		</AppProvider>
	);
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
	return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
	return boundary.headers(headersArgs);
};
