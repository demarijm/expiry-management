import { IndexTable, Text } from "@shopify/polaris";
import { ExpirationManager } from "./expiration-manager";

const ProductTable = function ({ products }: { products: any[] }) {

    const rowMarkup = products.map((data: any, index: number) => {
        const {
            id,
            title,
            date,
            handle,
            status,
            metafields,
            paymentStatus,
            fulfillmentStatus,
        } = data.node;
    
        const expiryMetaField = metafields.edges.filter((field: any) => field.node.key === "expiration_date");
        const expirationDateMetaField = expiryMetaField.length ? expiryMetaField.slice(-1)[0].node : null;
    
        return (
            <IndexTable.Row
                id={id}
                key={id}
                // selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {title}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{date}</IndexTable.Cell>
                <IndexTable.Cell>{handle}</IndexTable.Cell>
    
                <IndexTable.Cell>
                    <ExpirationManager productId={id} value={expirationDateMetaField?.value || ""} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" alignment="end" numeric>
                        {status}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
                <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    return (
        <IndexTable
            itemCount={products.length}
            // columnContentTypes={["text", "text", "text"]}
            headings={[
                { title: "Title" },
                { title: "Date" },
                { title: "Handle" },
                {
                    title: "Expiration Date",
                },
                {
                    title: "Expiration Status",
                },
                { title: "Payment status" },
                { title: "Fulfillment status" },
            ]}
        >
            {rowMarkup}
        </IndexTable>
    );
};

export default ProductTable;
