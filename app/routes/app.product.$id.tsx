import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Box,
  RadioButton,
  Select,
  Checkbox,
  Badge,
  InlineGrid,
  Banner,
} from "@shopify/polaris";
import { Metafields } from "app/constants/metafields";
import {
  getProductMetafield,
  upsertProductExpirationDate,
  upsertProductExpirationDateStatus,
  upsertProductWarningDate,
} from "app/features/expiration-manager/api/expiration-manager.server";
import InputDatePicker from "app/features/expiration-manager/components/input-date-picker";
import {
  convertDaysToDate,
  expirationDateInWords,
  getExpirationDateStatus,
  warningDateInWords,
} from "app/features/expiration-manager/utils/utils";
import { addLogs } from "app/services/logs.server";
import { getSettings } from "app/services/settings.server";
import { authenticate } from "app/shopify.server";
import { format, isAfter, isBefore } from "date-fns";
import { useCallback, useEffect, useState } from "react";

export const loader: LoaderFunction = async function ({ request, params }) {
  const { admin, session } = await authenticate.admin(request);

  const settings = await getSettings(session.shop);

  const { id } = params;
  const productId = `gid://shopify/Product/${id || 0}`;

  const response = await admin.graphql(
    `#graphql
    query {
      product(id: "${productId}") {
        id
        title
        metafields(first: 5, namespace: "expiration_manager") {
          edges {
            node {
              key
              value
            }
          }
        }
      }
    }`,
  );

  const { data } = await response.json();
  const product = data.product;

  const expirationStatusMetafield = await getProductMetafield(
    admin,
    productId,
    Metafields.expiration_status.namespace,
    Metafields.expiration_status.key,
  );
  const expirationDateMetafield = await getProductMetafield(
    admin,
    productId,
    Metafields.expiration_date.namespace,
    Metafields.expiration_date.key,
  );
  const warningDateMetafield = await getProductMetafield(
    admin,
    productId,
    Metafields.expiration_warning_date.namespace,
    Metafields.expiration_warning_date.key,
  );

  return json({
    product,
    expirationDateMetafield,
    warningDateMetafield,
    expirationStatusMetafield,
    expired:
      expirationDateMetafield &&
      isAfter(new Date(), new Date(expirationDateMetafield.value)),
    expiringSoon:
      warningDateMetafield &&
      isAfter(new Date(), new Date(warningDateMetafield.value)) &&
      isBefore(new Date(), new Date(expirationDateMetafield.value)),
    settings,
  });
};

export const action: ActionFunction = async function ({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  const action = formData.get("action") as string;
  const productId = (formData.get("productId") as string) || "";

  if (action === "save") {
    const expirationDate = formData.get("expirationDate") as string;
    const warningDate = formData.get("warningDate") as string;

    const expirationDateMetafield = await upsertProductExpirationDate(
      admin,
      session.shop,
      productId,
      expirationDate,
    );
    const warningDateMetafield = await upsertProductWarningDate(
      admin,
      session.shop,
      productId,
      warningDate,
    );

    return json({
      expirationDateMetafield,
      warningDateMetafield,
      successMessage: "Product expiration date updated.",
    });
  } else if (action === "activate") {
    const expirationDateStatus = formData.get("expirationStatus") as string;

    const expirationDateStatusMetafield =
      await upsertProductExpirationDateStatus(
        admin,
        session.shop,
        productId,
        expirationDateStatus,
      );

    let msgStatus = "";

    if (expirationDateStatus === "true") {
      msgStatus = "activated";

      await addLogs({
        shop: session.shop,
        action: "product.expiration_date.activate",
        description: `Product: ${productId} - Expiration date activated`,
        type: "success",
      });
    } else {
      msgStatus = "deactivated";

      await addLogs({
        shop: session.shop,
        action: "product.expiration_date.deactivate",
        description: `Product: ${productId} - Expiration date deactivated`,
        type: "success",
      });
    }

    return json({
      expirationDateStatusMetafield,
      successMessage: `Product expiration date ${msgStatus}.`,
    });
  }

  return null;
};

type FormPayload = {
  expirationDate: string;
  warningDate: string;
};

export default function ProductPage() {
  const {
    product,
    expirationDateMetafield,
    warningDateMetafield,
    expirationStatusMetafield,
    expired,
    expiringSoon,
    settings,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const shopify = useAppBridge();
  const navigation = useNavigation();
  const submit = useSubmit();

  const initialData: FormPayload = {
    expirationDate: format(new Date(), "yyyy-MM-dd"),
    warningDate: format(new Date(), "yyyy-MM-dd"),
  };

  if (expirationDateMetafield) {
    initialData.expirationDate = expirationDateMetafield.value;
  }

  if (warningDateMetafield) {
    initialData.warningDate = warningDateMetafield.value;
  }

  const [formState, setFormState] = useState<FormPayload>(initialData);
  const [cleanFormState, setCleanFormState] =
    useState<FormPayload>(initialData);

  const [setAlert, toggleSetAlert] = useState(false);
  const [warningAlertOption, setWarningAlertOption] = useState("default");
  const [selectedCustomPeriod, setSelectedCustomPeriod] = useState("week");

  const [activateError, setActivateError] = useState(false);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const isSaving =
    navigation.formData?.get("action") === "save" &&
    navigation.state === "submitting";

  const selectOptions = [
    { label: "7 Days", value: "week" },
    { label: "30 Days", value: "month" },
    { label: "Custom Date", value: "custom_date" },
  ];

  const handleCheckboxChange = useCallback((value: boolean) => {
    toggleSetAlert(value);
  }, []);

  const handleRadioChange = useCallback(
    (_: boolean, value: string) => {
      if (value === "default") {
        setFormState({
          ...formState,
          warningDate: convertDaysToDate(
            settings.warningPeriod,
            new Date(formState.expirationDate),
          ),
        });
        setSelectedCustomPeriod("week");
      } else {
        setFormState({
          ...formState,
          warningDate: convertDaysToDate(7, new Date(formState.expirationDate)),
        });
      }

      setWarningAlertOption(value);
    },
    [formState],
  );

  const handleSelectChange = useCallback(
    (value: string) => {
      if (value === "week") {
        setFormState({
          ...formState,
          warningDate: convertDaysToDate(7, new Date(formState.expirationDate)),
        });
      } else if (value === "month") {
        setFormState({
          ...formState,
          warningDate: convertDaysToDate(
            30,
            new Date(formState.expirationDate),
          ),
        });
      }

      setSelectedCustomPeriod(value);
    },
    [formState],
  );

  const handleSelectDate = useCallback(
    (value: string) =>
      setFormState({
        ...formState,
        expirationDate: value,
      }),
    [],
  );

  const handleSelectWarningDate = useCallback(
    (value: string) =>
      setFormState({
        ...formState,
        warningDate: value,
      }),
    [],
  );

  function handlePrimaryAction() {
    const data: any = {
      ...formState,
      action: "save",
      productId: product.id,
    };

    if (!warningDateMetafield && !setAlert) {
      data.warningDate = convertDaysToDate(
        settings?.warningPeriod,
        new Date(formState.expirationDate),
      );
    }

    setCleanFormState({ ...formState });
    submit(data, { method: "POST" });
  }

  function handleSecondaryAction() {
    const status = getExpirationDateStatus(expirationStatusMetafield);

    if (!expirationDateMetafield && !warningDateMetafield && !status) {
      setActivateError(true);
      return;
    }

    const value = status ? "false" : "true";

    const data: any = {
      action: "activate",
      productId: product.id,
      expirationStatus: value,
    };

    submit(data, { method: "POST" });
  }

  useEffect(() => {
    if (setAlert && warningAlertOption === "default") {
      setFormState({
        ...formState,
        warningDate: convertDaysToDate(
          settings?.warningPeriod,
          new Date(formState.expirationDate),
        ),
      });
    }
  }, [setAlert]);

  useEffect(() => {
    if (actionData?.successMessage) {
      shopify.toast.show(actionData?.successMessage);
    }
  }, [actionData]);

  function AlertBadge() {
    if (expired) {
      return <Badge tone="critical">Expired</Badge>;
    }

    if (expiringSoon) {
      return <Badge tone="warning">Expiring Soon</Badge>;
    }
    return null;
  }

  return (
    <Page
      backAction={{ content: "Products", url: "/app/products" }}
      title={product.title}
      titleMetadata={<AlertBadge />}
      primaryAction={{
        content: "Save",
        loading: isSaving,
        disabled: !isDirty || isSaving,
        onAction: handlePrimaryAction,
      }}
      secondaryActions={[
        {
          content: getExpirationDateStatus(expirationStatusMetafield)
            ? "Deactivate"
            : "Activate",
          onAction: handleSecondaryAction,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            {activateError && (
              <Banner
                title="Before you can activate a product expiration date, this change needs to be made:"
                tone="warning"
                onDismiss={() => {
                  setActivateError(false);
                }}
              >
                <List>
                  <List.Item>Set the expiration date.</List.Item>
                  <List.Item>Set the alert period.</List.Item>
                </List>
              </Banner>
            )}

            <Card>
              <Text as="h2" variant="headingSm">
                Expiration Date
              </Text>
              <Box paddingBlockStart="200">
                <BlockStack gap="300">
                  <InputDatePicker
                    value={formState.expirationDate}
                    disableDatesBefore={new Date()}
                    onSelectDate={handleSelectDate}
                  />

                  <Checkbox
                    label="Set alert warning"
                    checked={setAlert}
                    onChange={handleCheckboxChange}
                  />
                </BlockStack>
              </Box>
            </Card>

            {setAlert && (
              <Card>
                <Text as="h2" variant="headingSm">
                  Warning alert
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="300">
                    <BlockStack gap="300">
                      <RadioButton
                        label="Use default warning period"
                        helpText={
                          <span>
                            This will set the warning period based on the{" "}
                            <Link url="/app/settings">settings</Link>.
                          </span>
                        }
                        checked={warningAlertOption === "default"}
                        id="default"
                        name="warningAlertOption"
                        onChange={handleRadioChange}
                      />
                      <RadioButton
                        label="Set custom warning period"
                        id="custom"
                        name="warningAlertOption"
                        checked={warningAlertOption === "custom"}
                        onChange={handleRadioChange}
                      />

                      {warningAlertOption === "custom" && (
                        <Select
                          label=""
                          options={selectOptions}
                          onChange={handleSelectChange}
                          value={selectedCustomPeriod}
                        />
                      )}

                      {selectedCustomPeriod === "custom_date" && (
                        <InputDatePicker
                          value={formState.warningDate}
                          disableDatesAfter={new Date(formState.expirationDate)}
                          onSelectDate={handleSelectWarningDate}
                        />
                      )}
                    </BlockStack>
                  </BlockStack>
                </Box>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <InlineGrid gap="400" columns={["twoThirds", "oneThird"]}>
                  <div>
                    <Text variant="headingMd" as="h6">
                      {product.title || ""}
                    </Text>
                  </div>

                  <div>
                    {getExpirationDateStatus(expirationStatusMetafield) ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge>Inactive</Badge>
                    )}
                  </div>
                </InlineGrid>
              </BlockStack>

              <BlockStack gap="200">
                <Text variant="headingMd" as="h6">
                  Details
                </Text>

                <List>
                  {expirationDateMetafield && expirationDateMetafield?.value ? (
                    <>
                      <List.Item>
                        Expiration Date:{" "}
                        {format(new Date(expirationDateMetafield.value), "PP")}
                      </List.Item>
                      {}
                      <List.Item>
                        Expire{" "}
                        {expirationDateInWords(
                          new Date(expirationDateMetafield.value),
                        )}
                      </List.Item>
                    </>
                  ) : (
                    <List.Item>No expiration date</List.Item>
                  )}

                  {expirationDateMetafield &&
                  warningDateMetafield &&
                  warningDateMetafield?.value ? (
                    <>
                      <List.Item>
                        Alert Date:{" "}
                        {format(new Date(warningDateMetafield.value), "PP")}
                      </List.Item>
                      {}
                      <List.Item>
                        {warningDateInWords(
                          new Date(warningDateMetafield.value),
                          new Date(expirationDateMetafield.value),
                        )}
                      </List.Item>
                    </>
                  ) : (
                    <List.Item>No expiration alert date</List.Item>
                  )}

                  <List.Item>
                    Expiration is{" "}
                    {expirationStatusMetafield ? "activated" : "not active yet"}
                  </List.Item>
                </List>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
