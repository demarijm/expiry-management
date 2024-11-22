import { Logs } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { IndexTable, Text, useBreakpoints } from "@shopify/polaris";
import { format } from "date-fns";

const LogsTable = function ({ logs, loading }: { logs: any[], loading?: boolean }) {

    const navigate = useNavigate();

    const resourceName = {
        singular: 'log',
        plural: 'logs',
    };

    const rowMarkup = logs.map((log: Logs, index: number) => {

        const { id, shop, action, description, type, occured_at } = log;

        return (
            <IndexTable.Row
                id={`${id}-${shop}`}
                key={id}
                position={index}
                onClick={() => navigate(`/app/log/${id}`)}
            >
                 <IndexTable.Cell>
                    <Text as="span">
                        {id}
                    </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                    <Text as="span">
                        {shop}
                    </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>{action}</IndexTable.Cell>

                <IndexTable.Cell>
                    {format(occured_at, "yyyy-MM-dd HH:mm:ss")}
                </IndexTable.Cell>

                <IndexTable.Cell>{description}</IndexTable.Cell>

                <IndexTable.Cell>{type}</IndexTable.Cell>

            </IndexTable.Row>
        );
    });

    return (
        <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={logs.length}
            headings={[
                { title: "Log ID" },
                { title: "Shop" },
                { title: "Action" },
                { title: "Date Time" },
                { title: "Description" },
                { title: "Type" },
            ]}
            selectable={false}
            loading={loading}
        >
            {rowMarkup}
        </IndexTable>
    );
};

export default LogsTable;
