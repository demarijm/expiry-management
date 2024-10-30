import {
	Box,
	Card,
	Layout,
	Link,
	List,
	Page,
	Text,
	BlockStack,
	Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "app/shopify.server";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { admin } = await authenticate.admin(request);
	const response = await admin.graphql(
		`#graphql
      query getAllProducts {
        products(first: 10) {
          edges {
            node {
              id
              title
              handle
              status
              tags
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                    barcode
                    createdAt
                  }
                }
              }
            }
          }
        }
      }`,
	);
	const responseJson = await response.json();

	return json({
		products: responseJson!.data.products.edges,
	});
};

// export const action = async ({ request }: ActionFunctionArgs) => {
//     const { admin } = await authenticate.admin(request);
//     const res = await admin.graphql(
//         `#graphql
//         mutation setExpiryDateMetafield {

//         }
//         `
//     )
// }

export default function AdditionalPage() {
	return (
		<Page>
			<TitleBar title="Settings" />
			<Layout>
				<Layout.Section>
					<Card>
						<BlockStack gap="300">
							<Text as="h2" variant="headingSm">
								Expiration date metafield
							</Text>
							<Text as="p" variant="bodyMd">
								The app template comes with an additional page which
								demonstrates how to create multiple pages within app navigation
								using <Button>Create the metfaield</Button>
								<Link
									url="https://shopify.dev/docs/apps/tools/app-bridge"
									target="_blank"
									removeUnderline
								>
									App Bridge
								</Link>
								.
							</Text>
							<Text as="p" variant="bodyMd">
								To create your own page and have it show up in the app
								navigation, add a page inside <Code>app/routes</Code>, and a
								link to it in the <Code>&lt;NavMenu&gt;</Code> component found
								in <Code>app/routes/app.jsx</Code>.
							</Text>
						</BlockStack>
					</Card>
				</Layout.Section>
				<Layout.Section variant="oneThird">
					<Card>
						<BlockStack gap="200">
							<Text as="h2" variant="headingMd">
								Resources
							</Text>
							<List>
								<List.Item>
									<Link
										url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
										target="_blank"
										removeUnderline
									>
										App nav best practices
									</Link>
								</List.Item>
							</List>
						</BlockStack>
					</Card>
				</Layout.Section>
			</Layout>
		</Page>
	);
}

function Code({ children }: { children: React.ReactNode }) {
	return (
		<Box
			as="span"
			padding="025"
			paddingInlineStart="100"
			paddingInlineEnd="100"
			background="bg-surface-active"
			borderWidth="025"
			borderColor="border"
			borderRadius="100"
		>
			<code>{children}</code>
		</Box>
	);
}
