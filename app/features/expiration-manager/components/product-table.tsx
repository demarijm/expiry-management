import { useNavigate } from "@remix-run/react";
import { Badge, IndexTable, InlineStack, Link, Text, Thumbnail, useBreakpoints } from "@shopify/polaris";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";

const ProductTable = function ({ products }: { products: any[] }) {

    const navigate = useNavigate();

    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

    const rowMarkup = products.map((data: any, index: number) => {
        const {
            id,
            title,
            handle,
            featuredMedia,
            expirationDate,
            expirationAlertDate,
            expirationStatus,
            expired,
            expiringSoon
        } = data;

        const productID = id.replace("gid://shopify/Product/", "");

        return (
            <IndexTable.Row
                id={id}
                key={id}
                position={index}
                onClick={() => navigate(`/app/product/${productID}`)}
            >
                <IndexTable.Cell>
                    <Thumbnail
                        source={featuredMedia?.preview?.image?.url || ImageIcon}
                        alt={title}
                        size="small"
                    />
                </IndexTable.Cell>
                
                <IndexTable.Cell>
                    <InlineStack gap="400">
                        <Text variant="bodyMd" fontWeight="bold" as="span">
                            {title}
                        </Text>
                        {expired && <Badge tone="critical">Expired</Badge>}
                        {expiringSoon && <Badge tone="warning">Expiring Soon</Badge>}
                    </InlineStack>
                </IndexTable.Cell>

                <IndexTable.Cell>{handle}</IndexTable.Cell>

                <IndexTable.Cell>{expirationAlertDate ? format(expirationAlertDate, "PP") : "---"}</IndexTable.Cell>

                <IndexTable.Cell>{expirationDate ? format(expirationDate, "PP") : "---"}</IndexTable.Cell>

                <IndexTable.Cell>
                    {expirationStatus ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}
                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    return (
        <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={products.length}
            headings={[
                { title: "Thumbnail", hidden: true },
                { title: "Product Name" },
                { title: "Handle" },
                { title: "Alert Date" },
                { title: "Expiration Date" },
                { title: "Expiration Status" }
            ]}
            selectable={false}
        >
            {rowMarkup}
        </IndexTable>
    );
};

export default ProductTable;
