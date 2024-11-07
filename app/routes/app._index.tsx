import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, json } from "@remix-run/react";
import {
	Page,
	Layout,
	Text,
	Card,
	Button,
	BlockStack,
	Box,
	Link,
	InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { generateProduct, loadProducts } from "app/services/shopify.service";
import {
	addExpiryDate,
	AddPayload,
	getProductExpiryDate,
	updateExpiryDate,
	UpdatePayload,
} from "app/features/expiration-manager/api/expiration-manager.server";
import ProductTable from "app/features/expiration-manager/components/product-table";


export const loader = async ({ request }: LoaderFunctionArgs) => {
	return await loadProducts(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const data: any = Object.fromEntries(await request.formData());

	if (data?.action === "generateProduct") {

		console.log("Generating Product...");
		return await generateProduct(request);
	} else if (data?.action === "saveProduct") {

		const id = data?.productId.replace("gid://shopify/Product/", "");
		const existingField = await getProductExpiryDate(Number(id), request);

		if (existingField) {
			const payload: UpdatePayload = {
				productId: Number(id),
				fieldId: existingField.id,
				expirationDate: data?.expirationDate,
			};

			const metafield = await updateExpiryDate(request, payload);

			return json({
				metafield,
				product: null,
				variant: null
			});
		} else {
			const payload: AddPayload = {
				productId: Number(id),
				expirationDate: data?.expirationDate,
			};

			const metafield = await addExpiryDate(request, payload);

			return json({
				metafield,
				product: null,
				variant: null
			});
		}
	}

	return null;
};

export default function Index() {
	const fetcher = useFetcher<typeof action>();
	const loaderData = useLoaderData<typeof loader>();
	const shopify = useAppBridge();

	const isLoading =
		["loading", "submitting"].includes(fetcher.state) &&
		fetcher.formMethod === "POST";
	const productId = fetcher.data?.product?.id.replace(
		"gid://shopify/Product/",
		"",
	);

	useEffect(() => {
		if (productId) {
			shopify.toast.show("Product created");
		}
	}, [productId, shopify]);

	const generateProduct = () =>
		fetcher.submit({ action: "generateProduct" }, { method: "POST" });

	return (
		<Page fullWidth>
			<TitleBar title="Remix app template">
				<button variant="primary" onClick={generateProduct}>
					Generate a product
				</button>
			</TitleBar>
			<BlockStack gap="800">
				<Layout>
					<Layout.Section>
						<Card>
							<ProductTable products={loaderData.products} />
						</Card>
					</Layout.Section>

					<Layout.Section>
						<Card>
							<BlockStack gap="500">
								<BlockStack gap="200">
									<Text as="h2" variant="headingMd">
										Congrats on creating a new Shopify app 🎉
									</Text>
									<Text variant="bodyMd" as="p">
										This embedded app template uses{" "}
										<Link
											url="https://shopify.dev/docs/apps/tools/app-bridge"
											target="_blank"
											removeUnderline
										>
											App Bridge
										</Link>{" "}
										interface examples like an{" "}
										<Link url="/app/additional" removeUnderline>
											additional page in the app nav
										</Link>
										, as well as an{" "}
										<Link
											url="https://shopify.dev/docs/api/admin-graphql"
											target="_blank"
											removeUnderline
										>
											Admin GraphQL
										</Link>{" "}
										mutation demo, to provide a starting point for app
										development.
									</Text>
								</BlockStack>
								<BlockStack gap="200">
									<pre>{JSON.stringify(loaderData, null, 2)}</pre>
									<Text as="h3" variant="headingMd">
										Get started with products
									</Text>
									<Text as="p" variant="bodyMd">
										Generate a product with GraphQL and get the JSON output for
										that product. Learn more about the{" "}
										<Link
											url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
											target="_blank"
											removeUnderline
										>
											productCreate
										</Link>{" "}
										mutation in our API references.
									</Text>
								</BlockStack>
								<InlineStack gap="300">
									<Button loading={isLoading} onClick={generateProduct}>
										Generate a product
									</Button>
									{fetcher.data?.product && (
										<Button
											url={`shopify:admin/products/${productId}`}
											target="_blank"
											variant="plain"
										>
											View product
										</Button>
									)}
								</InlineStack>
								{fetcher.data?.product && (
									<BlockStack>
										<Text as="h3" variant="headingMd">
											{" "}
											productCreate mutation
										</Text>
										<Box
											padding="400"
											background="bg-surface-active"
											borderWidth="025"
											borderRadius="200"
											borderColor="border"
											overflowX="scroll"
										>
											<pre style={{ margin: 0 }}>
												<code>
													{JSON.stringify(fetcher.data.product, null, 2)}
												</code>
											</pre>
										</Box>
										<Text as="h3" variant="headingMd">
											{" "}
											productVariantsBulkUpdate mutation
										</Text>
										<Box
											padding="400"
											background="bg-surface-active"
											borderWidth="025"
											borderRadius="200"
											borderColor="border"
											overflowX="scroll"
										>
											<pre style={{ margin: 0 }}>
												<code>
													{JSON.stringify(fetcher.data.variant, null, 2)}
												</code>
											</pre>
										</Box>
									</BlockStack>
								)}
							</BlockStack>
						</Card>
					</Layout.Section>
				</Layout>
			</BlockStack>
		</Page>
	);
}
